import { NextResponse } from "next/server";
import { createConfigurationSchema } from "@/lib/validation/configuration.schema";
import { contactDetailsSchema } from "@/lib/validation/contact.schema";
import { createResendClient } from "@/lib/email/resend";
import { renderConfigurationEmail } from "@/lib/email/templates/configuration-confirmation";
import { renderCustomerConfirmationEmail } from "@/lib/email/templates/customer-confirmation";
import { renderPlatePreviewPng } from "@/lib/email/plate-preview-image";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import { calculatePrice } from "@/lib/configuration/pricing";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import { saveOrderToDatabase } from "@/lib/mysql/client";
import { getNotificationEmail } from "@/lib/email/settings";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";

function buildOrderLabel(
  shape: { extraLines: number },
  position: "start" | "middle" | "end"
): string | undefined {
  if (shape.extraLines === 0) return undefined;
  if (shape.extraLines === 1) {
    return position === "end"
      ? "Tekstregel boven, huisnummer onder"
      : "Huisnummer boven, tekstregel onder";
  }
  if (position === "middle") {
    return "Tekstregel 1 boven, huisnummer midden, tekstregel 2 onder";
  }
  if (position === "end") {
    return "Tekstregel 1 boven, tekstregel 2 midden, huisnummer onder";
  }
  return "Huisnummer boven, tekstregel 1 midden, tekstregel 2 onder";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag: geen geldige JSON." },
      { status: 400 }
    );
  }

  const parsed = createConfigurationSchema.safeParse(body);
  const parsedContact = contactDetailsSchema.safeParse(body);

  if (!parsed.success || !parsedContact.success) {
    const issues = [
      ...(parsed.success ? [] : parsed.error.issues),
      ...(parsedContact.success ? [] : parsedContact.error.issues),
    ];
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        issues: issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const contact = parsedContact.data;

  // Prijzen (en maten met hun defaultMaxChars) worden hier, server-side,
  // opnieuw live opgehaald bij de prijsbeheeromgeving — met automatische
  // terugval op de vaste reservekopie als dat niet lukt. Zo blijft de
  // bevestigingsmail altijd kloppen met de daadwerkelijke, actuele prijs,
  // ongeacht wat de klant tijdens het configureren te zien kreeg.
  const pricingData = await getLivePricingData();

  const shape = productShapes.find((s) => s.id === data.shapeId);
  const color = productColors.find((c) => c.id === data.colorId);
  const size = pricingData.productSizes.find((s) => s.id === data.sizeId);
  const font = productFonts.find((f) => f.id === data.fontId);

  if (!shape || !color || !size || !font) {
    return NextResponse.json(
      { error: "Onbekende vorm, kleur, maat of lettertype." },
      { status: 400 }
    );
  }

  const fallbackAdminEmail = process.env.ADMIN_EMAIL;
  if (!fallbackAdminEmail) {
    console.error("ADMIN_EMAIL ontbreekt in de environment variables.");
    return NextResponse.json(
      { error: "E-mailconfiguratie ontbreekt op de server." },
      { status: 500 }
    );
  }
  // Adres komt bij voorkeur uit de instelling die via de knop
  // "E-mailinstellingen" in de prijstool is opgeslagen — anders uit
  // ADMIN_EMAIL hierboven als terugval.
  const adminEmail = await getNotificationEmail(
    "order_notification",
    fallbackAdminEmail
  );

  const orderLabel = buildOrderLabel(shape, data.numberPosition);

  const autoFit = computeAutoFit({
    widthMm: size.width,
    heightMm: size.height,
    numberChars: data.customText.length,
    line1Chars: shape.extraLines >= 1 ? data.extraLine1.length || null : null,
    line2Chars: shape.extraLines >= 2 ? data.extraLine2.length || null : null,
  });

  // Prijs wordt hier, server-side, opnieuw berekend met dezelfde functie als
  // de configurator zelf gebruikt (lib/configuration/pricing.ts) — nooit
  // een door de klant meegestuurd bedrag vertrouwen.
  const price = calculatePrice(data, pricingData);
  const priceFields = {
    priceTotalCents: price?.totalCents ?? null,
    priceColorSurchargeCents: price?.colorSurchargeCents ?? 0,
    priceExtraCharsCents: price?.extraCharsCents ?? 0,
    priceExtraCharsCount: price?.extraCharsCount ?? 0,
  };

  const html = renderConfigurationEmail({
    shapeName: shape.name,
    finish: data.finish,
    colorName: color.name,
    sizeName: size.name,
    customText: data.customText,
    extraLine1: data.extraLine1,
    extraLine2: data.extraLine2,
    numberSizeMm: autoFit.numberSizeMm,
    line1SizeMm: autoFit.line1SizeMm ?? undefined,
    line2SizeMm: autoFit.line2SizeMm ?? undefined,
    fontName: font.name,
    contact,
    orderLabel,
    ...priceFields,
  });

  try {
    const resend = createResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `Huisnummerbordjes configurator <${fromAddress}>`,
      to: adminEmail,
      subject: `Nieuwe configuratie van ${contact.name}: ${shape.name} — ${data.customText}`,
      html,
    });

    if (error) {
      console.error("Resend-fout (interne melding):", error);
      return NextResponse.json(
        { error: "Versturen van de e-mail is mislukt." },
        { status: 502 }
      );
    }

    // De bestelling is hiermee echt bevestigd (de interne meldingsmail is
    // gelukt) — vanaf hier bewaren we 'm ook in de MySQL-database, als
    // aanvulling op de e-mail. Lukt dat onverhoopt niet (bv. de database is
    // even niet bereikbaar), dan mag dat de bestelling zelf nooit
    // blokkeren: de klant en Christiaan hebben dan nog steeds gewoon hun
    // e-mail. We loggen de fout alleen, voor eventueel later handmatig
    // navragen (zichtbaar in de Vercel-functielogs).
    try {
      await saveOrderToDatabase({
        shapeId: shape.id,
        shapeName: shape.name,
        finish: data.finish,
        colorId: color.id,
        colorName: color.name,
        sizeId: size.id,
        sizeName: size.name,
        fontId: font.id,
        fontName: font.name,
        customText: data.customText,
        extraLine1: data.extraLine1 || null,
        extraLine2: data.extraLine2 || null,
        numberPosition: data.numberPosition,
        priceTotalCents: priceFields.priceTotalCents,
        priceColorSurchargeCents: priceFields.priceColorSurchargeCents,
        priceExtraCharsCents: priceFields.priceExtraCharsCents,
        priceExtraCharsCount: priceFields.priceExtraCharsCount,
        priceSource: pricingData.bron,
        contactName: contact.name,
        contactAddress: contact.address,
        contactPostalCode: contact.postalCode,
        contactCity: contact.city,
        contactEmail: contact.email,
        contactPhone: contact.phone || null,
        quantity: contact.quantity,
      });
    } catch (dbError) {
      console.error(
        "Opslaan van de bestelling in de database is mislukt (e-mail is wel verstuurd):",
        dbError instanceof Error ? dbError.message : dbError
      );
    }

    // Voorbeeldafbeelding van het geconfigureerde bordje, voor in de
    // bevestigingsmail aan de klant (gevraagd door Christiaan, 19-8-2026:
    // "zodat de klant weet wat er besteld is"). Bewust NIET verstuurd als
    // publieke afbeeldings-URL, maar als losse bijlage met een content-id
    // (cid) — dat werkt betrouwbaar in alle e-mailclients, ook Outlook
    // (die data-URI-afbeeldingen niet toont). Mislukt het genereren om wat
    // voor reden dan ook, dan mag dat de bestelbevestiging zelf nooit
    // blokkeren: de e-mail gaat dan gewoon zonder afbeelding.
    const PREVIEW_IMAGE_CID = "bordje-voorbeeld";
    let previewImageBuffer: Buffer | null = null;
    try {
      previewImageBuffer = await renderPlatePreviewPng({
        isOval: shape.id === "ovaal",
        isCurved: data.finish !== "vlak",
        widthMm: size.width,
        heightMm: size.height,
        colorHex: color.hex,
        fontId: font.id,
        numberText: data.customText,
        line1Text: shape.extraLines >= 1 ? data.extraLine1 : null,
        line2Text: shape.extraLines >= 2 ? data.extraLine2 : null,
        numberPosition: data.numberPosition,
      });
    } catch (previewError) {
      console.error(
        "Genereren van de voorbeeldafbeelding voor de klantmail is mislukt (e-mail wordt wel zonder afbeelding verstuurd):",
        previewError instanceof Error ? previewError.message : previewError
      );
    }

    const customerHtml = renderCustomerConfirmationEmail({
      contactName: contact.name,
      shapeName: shape.name,
      finish: data.finish,
      colorName: color.name,
      sizeName: size.name,
      customText: data.customText,
      extraLine1: data.extraLine1,
      extraLine2: data.extraLine2,
      fontName: font.name,
      quantity: contact.quantity,
      orderLabel,
      previewImageCid: previewImageBuffer ? PREVIEW_IMAGE_CID : undefined,
      ...priceFields,
    });

    const { error: customerError } = await resend.emails.send({
      from: `Huisnummerbordjes <${fromAddress}>`,
      to: contact.email,
      subject: "Bevestiging van je bestelling — Huisnummerbordjes",
      html: customerHtml,
      attachments: previewImageBuffer
        ? [
            {
              content: previewImageBuffer,
              filename: "voorbeeld-bordje.png",
              inlineContentId: PREVIEW_IMAGE_CID,
            },
          ]
        : undefined,
    });

    if (customerError) {
      console.error("Resend-fout (klantbevestiging):", customerError);
      return NextResponse.json({
        success: true,
        warning:
          "Je configuratie is bij ons binnengekomen, maar de bevestigingsmail naar jouzelf kon niet worden verstuurd.",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Serverfout bij versturen e-mail:", err);
    return NextResponse.json(
      { error: "Er ging iets mis op de server." },
      { status: 500 }
    );
  }
}
