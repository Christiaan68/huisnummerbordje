import { NextResponse } from "next/server";
import { createConfigurationSchema } from "@/lib/validation/configuration.schema";
import { contactDetailsSchema } from "@/lib/validation/contact.schema";
import { createResendClient } from "@/lib/email/resend";
import { renderConfigurationEmail } from "@/lib/email/templates/configuration-confirmation";
import { renderCustomerConfirmationEmail } from "@/lib/email/templates/customer-confirmation";
import {
  productShapes,
  productColors,
  productSizes,
  productFonts,
} from "@/config/product-options";

/**
 * POST /api/send-email
 * Ontvangt de volledige configuratie (nog niet opgeslagen in Supabase —
 * dat volgt in FASE 12), valideert server-side, en verstuurt direct een
 * bevestigingsmail naar ADMIN_EMAIL via Resend.
 */
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

  const shape = productShapes.find((s) => s.id === data.shapeId);
  const color = productColors.find((c) => c.id === data.colorId);
  const size = productSizes.find((s) => s.id === data.sizeId);
  const font = productFonts.find((f) => f.id === data.fontId);

  if (!shape || !color || !size || !font) {
    return NextResponse.json(
      { error: "Onbekende vorm, kleur, maat of lettertype." },
      { status: 400 }
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("ADMIN_EMAIL ontbreekt in de environment variables.");
    return NextResponse.json(
      { error: "E-mailconfiguratie ontbreekt op de server." },
      { status: 500 }
    );
  }

  const html = renderConfigurationEmail({
    shapeName: shape.name,
    finish: data.finish,
    colorName: color.name,
    sizeName: size.name,
    customText: data.customText,
    extraLine1: data.extraLine1,
    extraLine2: data.extraLine2,
    numberSizeMm: data.numberSizeMm,
    line1SizeMm: data.line1SizeMm,
    line2SizeMm: data.line2SizeMm,
    fontName: font.name,
    contact,
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

    // Bevestigingsmail naar de klant zelf. Dit is een tweede, aparte mail
    // met een klantvriendelijke toon — mislukt deze, dan blokkeert dat niet
    // de hoofdflow (de interne melding is al binnen), maar we laten het wel
    // duidelijk weten in de respons.
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
    });

    const { error: customerError } = await resend.emails.send({
      from: `Huisnummerbordjes <${fromAddress}>`,
      to: contact.email,
      subject: "Bevestiging van je bestelling — Huisnummerbordjes",
      html: customerHtml,
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
