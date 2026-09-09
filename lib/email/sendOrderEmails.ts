import { createResendClient } from "@/lib/email/resend";
import {
  renderConfigurationEmail,
  translateShapeName,
} from "@/lib/email/templates/configuration-confirmation";
import { renderCustomerConfirmationEmail } from "@/lib/email/templates/customer-confirmation";
import { renderPlatePreviewPng } from "@/lib/email/plate-preview-image";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import type { EarsStyle } from "@/lib/configuration/plate-visual";

/**
 * Bouwt en verstuurt de twee bevestigingsmails (intern naar de webshop +
 * naar de klant zelf) voor één bestelling, inclusief de gegenereerde
 * voorbeeldafbeelding van het bordje.
 *
 * Tot 29-8-2026 stond deze logica rechtstreeks in app/api/send-email/
 * route.ts en liep hij op het moment dat de klant zijn gegevens invulde —
 * er werd toen nog niet betaald. Sinds de invoering van Mollie wordt een
 * bestelling al bij het aanmaken van de betaling in de database gezet (zie
 * app/api/create-payment/route.ts), en gaan deze mails pas uit zodra Mollie
 * via de webhook (app/api/mollie-webhook/route.ts) een gelukte betaling
 * bevestigt — daarom is deze logica hierheen verplaatst, zodat beide
 * plekken 'm hetzelfde kunnen gebruiken.
 *
 * Belangrijk verschil met vroeger: destijds blokkeerde een mislukte interne
 * mail de rest van het proces (geen database-opslag, geen klantmail) — dat
 * kon toen nog, want er was nog niets definitiefs gebeurd. Nu is de
 * betaling op het moment dat deze functie draait al écht gelukt (bevestigd
 * door Mollie) en de bestelling al als 'paid' in de database gezet, dus een
 * hapering bij één van de twee mails mag de andere niet meer blokkeren —
 * beide verzendpogingen gebeuren daarom onafhankelijk van elkaar, en falen
 * wordt alleen gelogd (zichtbaar in de Vercel-functielogs), nooit gegooid.
 */

export interface SendOrderEmailsInput {
  // Het eigen bestelnummer van de webshop (het rij-id in de database) — op
  // verzoek van Christiaan (29-8-2026) voortaan ook zichtbaar in beide
  // mails, zodat een klant of Christiaan zelf er makkelijk naar kan
  // verwijzen (bijvoorbeeld bij contact, of om 'm te herkennen in Mollies
  // "Verrekeningen"-overzicht, waar dezelfde nummering al in de
  // betaalomschrijving stond — zie app/api/create-payment/route.ts).
  orderId: number;
  // id toegevoegd 9-9-2026, samen met emailLanguage — nodig om de Duitse
  // vertaling van de vormnaam op te kunnen zoeken (zie shapeNames in
  // lib/email/templates/configuration-confirmation.ts) op basis van een
  // stabiel id in plaats van de Nederlandse naam-tekst zelf.
  shape: { id: string; name: string; extraLines: number };
  finish: "vlak" | "gewelfd";
  // colorName: verplicht voor colorMode "single"-vormen (de 4
  // oorspronkelijke vormen). Sinds 9-9-2026 (uitbreiding naar 7 vormen)
  // optioneel: voor colorMode "ears-and-plate"-vormen (de 3 nieuwe
  // "oren"-vormen) blijft dit veld leeg/niet meegegeven, en zijn juist
  // earColorName + plateColorName hieronder gevuld — vul dus ÓF colorName,
  // ÓF earColorName+plateColorName, NOOIT beide tegelijk. Zie
  // types/configuration.ts (ConfiguratorSelection) voor dezelfde
  // "óf/óf"-opzet.
  colorName?: string;
  // earColorName/plateColorName: toegevoegd 9-9-2026 voor colorMode
  // "ears-and-plate"-vormen — kleur van de "oren" resp. het vlak. Zie de
  // toelichting bij colorName hierboven.
  earColorName?: string;
  plateColorName?: string;
  colorHex: string;
  // earColorHex/plateColorHex/shapeKind/earsStyle: het beeld-tegenhanger van
  // earColorName/plateColorName hierboven — nodig om de voorbeeldafbeelding
  // (renderPlatePreviewPng, zie lib/email/plate-preview-image.tsx) voor de
  // 3 "oren"-vormen met de juiste 2 losse kleuren en oren-geometrie te
  // tekenen. Zelfde "óf/óf" als colorHex/colorName: bij colorMode
  // "ears-and-plate" earColorHex+plateColorHex+shapeKind:"ears"+earsStyle
  // invullen, bij colorMode "single" alleen colorHex (isOval bepaalt dan
  // nog steeds rect vs. ovaal, zoals al vóór 9-9-2026). Optioneel gehouden
  // (i.p.v. verplicht) zodat een aanroeper die deze velden nog niet
  // doorgeeft niet breekt — renderPlatePreviewPng valt dan terug op
  // colorHex/"rect"|"oval" (zie plate-preview-image.tsx).
  earColorHex?: string;
  plateColorHex?: string;
  shapeKind?: "rect" | "oval" | "ears";
  earsStyle?: EarsStyle;
  isOval: boolean;
  widthMm: number;
  heightMm: number;
  sizeName: string;
  numberFontId: string;
  numberFontName: string;
  line1FontId?: string | null;
  line1FontName?: string | null;
  line2FontId?: string | null;
  line2FontName?: string | null;
  customText: string;
  extraLine1?: string | null;
  extraLine2?: string | null;
  numberPosition: "start" | "middle" | "end";
  hasFrame: boolean;
  orderLabel?: string;
  priceTotalCents: number | null;
  priceColorSurchargeCents: number;
  priceExtraCharsCents: number;
  priceExtraCharsCount: number;
  priceFrameSurchargeCents: number;
  contact: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    email: string;
    phone?: string | null;
    quantity: string;
  };
  adminEmail: string;
  // Taal van de interne meldingsmail ("Configuratie bestelling webshop"),
  // per vorm ingesteld in de prijstool (zie lib/email/shapeLanguage.ts) —
  // "nl" als er voor deze vorm nog niets is ingesteld. Geldt uitsluitend
  // voor deze interne mail; de bevestigingsmail aan de klant
  // (renderCustomerConfirmationEmail hieronder) blijft altijd Nederlands.
  emailLanguage: "nl" | "de";
  // Betaalgegevens (toegevoegd 29-8-2026, na de eerste live test): al
  // opgezocht/geformatteerd bij Mollie vandaan gehaald door de aanroeper
  // (zie app/api/mollie-webhook/route.ts, getPaymentMethodLabel/
  // formatDutchDateTime) — deze functie geeft ze alleen door aan de
  // sjablonen.
  paymentMethodName: string;
  paidAtFormatted: string;
}

export interface SendOrderEmailsResult {
  internalEmailSent: boolean;
  customerEmailSent: boolean;
}

export async function sendOrderEmails(
  input: SendOrderEmailsInput
): Promise<SendOrderEmailsResult> {
  const priceFields = {
    priceTotalCents: input.priceTotalCents,
    priceColorSurchargeCents: input.priceColorSurchargeCents,
    priceExtraCharsCents: input.priceExtraCharsCents,
    priceExtraCharsCount: input.priceExtraCharsCount,
    priceFrameSurchargeCents: input.priceFrameSurchargeCents,
  };

  // Zelfde autofit-berekening als voorheen in app/api/send-email/route.ts —
  // de uitkomst (numberSizeMm enz.) wordt door de e-mailsjablonen op dit
  // moment niet zichtbaar gebruikt, maar hoort wel bij het verwachte type;
  // zie de toelichting daar.
  const autoFit = computeAutoFit({
    widthMm: input.widthMm,
    heightMm: input.heightMm,
    numberChars: input.customText.length,
    line1Chars: input.extraLine1 ? input.extraLine1.length || null : null,
    line2Chars: input.extraLine2 ? input.extraLine2.length || null : null,
    numberFontId: input.numberFontId,
    line1FontId: input.line1FontId,
    line2FontId: input.line2FontId,
  });

  const PREVIEW_IMAGE_CID = "bordje-voorbeeld";
  let previewImageBuffer: Buffer | null = null;
  try {
    previewImageBuffer = await renderPlatePreviewPng({
      isOval: input.isOval,
      shapeKind: input.shapeKind,
      earsStyle: input.earsStyle,
      isCurved: input.finish !== "vlak",
      isFramed: input.hasFrame,
      widthMm: input.widthMm,
      heightMm: input.heightMm,
      colorHex: input.colorHex,
      earColorHex: input.earColorHex,
      plateColorHex: input.plateColorHex,
      numberFontId: input.numberFontId,
      line1FontId: input.line1FontId,
      line2FontId: input.line2FontId,
      numberText: input.customText,
      line1Text: input.extraLine1,
      line2Text: input.extraLine2,
      numberPosition: input.numberPosition,
    });
  } catch (previewError) {
    console.error(
      "Genereren van de voorbeeldafbeelding is mislukt (mail(s) worden wel zonder afbeelding verstuurd):",
      previewError instanceof Error ? previewError.message : previewError
    );
  }

  const resend = createResendClient();
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const attachments = previewImageBuffer
    ? [
        {
          content: previewImageBuffer,
          filename: "voorbeeld-bordje.png",
          inlineContentId: PREVIEW_IMAGE_CID,
        },
      ]
    : undefined;

  let internalEmailSent = false;
  try {
    const html = renderConfigurationEmail({
      orderNumber: `#${input.orderId}`,
      shapeName: input.shape.name,
      shapeId: input.shape.id,
      finish: input.finish,
      colorName: input.colorName,
      earColorName: input.earColorName,
      plateColorName: input.plateColorName,
      sizeName: input.sizeName,
      customText: input.customText,
      extraLine1: input.extraLine1 ?? undefined,
      extraLine2: input.extraLine2 ?? undefined,
      numberSizeMm: autoFit.numberSizeMm,
      line1SizeMm: autoFit.line1SizeMm ?? undefined,
      line2SizeMm: autoFit.line2SizeMm ?? undefined,
      numberFontName: input.numberFontName,
      line1FontName: input.line1FontName ?? undefined,
      line2FontName: input.line2FontName ?? undefined,
      hasFrame: input.hasFrame,
      contact: {
        name: input.contact.name,
        address: input.contact.address,
        postalCode: input.contact.postalCode,
        city: input.contact.city,
        email: input.contact.email,
        phone: input.contact.phone ?? undefined,
        quantity: input.contact.quantity,
      },
      orderLabel: input.orderLabel,
      previewImageCid: previewImageBuffer ? PREVIEW_IMAGE_CID : undefined,
      paymentMethodName: input.paymentMethodName,
      paidAt: input.paidAtFormatted,
      language: input.emailLanguage,
      ...priceFields,
    });

    // Onderwerp van de interne meldingsmail volgt dezelfde, per vorm
    // ingestelde taal als de rest van de mail (zie
    // lib/email/templates/configuration-confirmation.ts) — de bestelgegevens
    // zelf (naam, tekst) blijven ongewijzigd. De vormnaam wordt, net als in
    // de body, wél vertaald (translateShapeName) — dat is een vaste tekst
    // uit een bekende, beperkte lijst, geen vrije klantinvoer (toegevoegd
    // 9-9-2026, samen met de vertaling in de mail-body zelf).
    const translatedShapeName = translateShapeName(
      input.shape.id,
      input.emailLanguage,
      input.shape.name
    );
    const internalSubject =
      input.emailLanguage === "de"
        ? `Neue (bezahlte) Bestellung von ${input.contact.name}: ${translatedShapeName} — ${input.customText}`
        : `Nieuwe (betaalde) bestelling van ${input.contact.name}: ${translatedShapeName} — ${input.customText}`;

    const { error } = await resend.emails.send({
      from: `Huisnummerbordjes configurator <${fromAddress}>`,
      to: input.adminEmail,
      subject: internalSubject,
      html,
      attachments,
    });

    if (error) {
      console.error("Resend-fout (interne melding, betaalde bestelling):", error);
    } else {
      internalEmailSent = true;
    }
  } catch (err) {
    console.error(
      "Onverwachte fout bij het versturen van de interne meldingsmail (betaalde bestelling):",
      err instanceof Error ? err.message : err
    );
  }

  let customerEmailSent = false;
  try {
    const customerHtml = renderCustomerConfirmationEmail({
      orderNumber: `#${input.orderId}`,
      contactName: input.contact.name,
      shapeName: input.shape.name,
      finish: input.finish,
      colorName: input.colorName,
      earColorName: input.earColorName,
      plateColorName: input.plateColorName,
      sizeName: input.sizeName,
      customText: input.customText,
      extraLine1: input.extraLine1 ?? undefined,
      extraLine2: input.extraLine2 ?? undefined,
      numberFontName: input.numberFontName,
      line1FontName: input.line1FontName ?? undefined,
      line2FontName: input.line2FontName ?? undefined,
      hasFrame: input.hasFrame,
      quantity: input.contact.quantity,
      orderLabel: input.orderLabel,
      previewImageCid: previewImageBuffer ? PREVIEW_IMAGE_CID : undefined,
      paymentMethodName: input.paymentMethodName,
      paidAt: input.paidAtFormatted,
      ...priceFields,
    });

    const { error: customerError } = await resend.emails.send({
      from: `Huisnummerbordjes <${fromAddress}>`,
      to: input.contact.email,
      subject: "Bevestiging van je bestelling — Huisnummerbordjes",
      html: customerHtml,
      attachments,
    });

    if (customerError) {
      console.error("Resend-fout (klantbevestiging, betaalde bestelling):", customerError);
    } else {
      customerEmailSent = true;
    }
  } catch (err) {
    console.error(
      "Onverwachte fout bij het versturen van de klantbevestiging (betaalde bestelling):",
      err instanceof Error ? err.message : err
    );
  }

  return { internalEmailSent, customerEmailSent };
}
