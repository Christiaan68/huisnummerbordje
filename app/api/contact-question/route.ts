import { NextResponse } from "next/server";
import { createConfigurationSchema } from "@/lib/validation/configuration.schema";
import { questionDetailsSchema } from "@/lib/validation/question.schema";
import { createResendClient } from "@/lib/email/resend";
import { getNotificationEmail } from "@/lib/email/settings";
import { renderQuestionNotificationEmail } from "@/lib/email/templates/question-notification";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";
import { isEarsShape, getEarsColorOptions } from "@/lib/configuration/shape-helpers";

/**
 * Verwerkt een vraag die een bezoeker stelt via de pop-up in de
 * configurator (zie components/configurator/QuestionModal.tsx). Stuurt
 * één e-mail naar Christiaan (ADMIN_EMAIL) met de vraag én de op dat
 * moment gekozen configuratie erbij, zodat direct duidelijk is waar de
 * vraag over gaat. Dit is los van, en heeft geen invloed op, het
 * daadwerkelijk bevestigen/bestellen van een configuratie
 * (app/api/send-email/route.ts) — een gestelde vraag is dus nooit een
 * bestelling.
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

  const parsedConfiguration = createConfigurationSchema.safeParse(body);
  const parsedQuestion = questionDetailsSchema.safeParse(body);

  if (!parsedConfiguration.success || !parsedQuestion.success) {
    const issues = [
      ...(parsedConfiguration.success ? [] : parsedConfiguration.error.issues),
      ...(parsedQuestion.success ? [] : parsedQuestion.error.issues),
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

  const data = parsedConfiguration.data;
  const question = parsedQuestion.data;

  // Zelfde live-prijs-ophaalfunctie als bij het bevestigen van een
  // bestelling (zie app/api/send-email/route.ts) — nodig omdat de
  // beschikbare maten (met hun namen) uit de prijstool komen, niet uit
  // het statische config/product-options.ts-bestand.
  const pricingData = await getLivePricingData();

  const shape = productShapes.find((s) => s.id === data.shapeId);
  const size = pricingData.productSizes.find((s) => s.id === data.sizeId);
  // Elk tekstveld heeft sinds 28-8-2026 zijn eigen lettertype (zie
  // types/configuration.ts) — line1Font/line2Font zijn alleen relevant als
  // de gekozen vorm die tekstregel ook echt heeft.
  const line1Font = data.line1FontId
    ? productFonts.find((f) => f.id === data.line1FontId)
    : undefined;
  const line2Font = data.line2FontId
    ? productFonts.find((f) => f.id === data.line2FontId)
    : undefined;

  // Sinds 9-9-2026 (uitbreiding naar 7 vormen): de 3 "oren"-vormen
  // (colorMode "ears-and-plate") kennen geen enkelvoudige `colorId` en geen
  // lettertypekeuze — zij hebben in plaats daarvan 2 losse verplichte
  // kleuren (oren + vlak), uit de aparte lijst productColorsOren. Zie
  // types/product.ts / lib/configuration/shape-helpers.ts en dezelfde
  // conditionele aanpak in components/configurator/ConfigurationSummary.tsx.
  const earsShape = isEarsShape(shape);
  const color = earsShape
    ? undefined
    : productColors.find((c) => c.id === data.colorId);
  const numberFont = earsShape
    ? undefined
    : productFonts.find((f) => f.id === data.numberFontId);
  const earsColors = earsShape ? getEarsColorOptions() : [];
  const earColor = earsShape
    ? earsColors.find((c) => c.id === data.earColorId)
    : undefined;
  const plateColor = earsShape
    ? earsColors.find((c) => c.id === data.plateColorId)
    : undefined;

  if (
    !shape ||
    !size ||
    (earsShape
      ? !earColor || !plateColor
      : !color ||
        !numberFont ||
        (shape.extraLines >= 1 && !line1Font) ||
        (shape.extraLines >= 2 && !line2Font))
  ) {
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
    "question_notification",
    fallbackAdminEmail
  );

  const html = renderQuestionNotificationEmail({
    shapeName: shape.name,
    // "Oren"-vormen kennen geen afwerking-, enkelvoudige kleur- of
    // lettertypekeuze — deze velden blijven voor hen bewust `undefined`
    // (in plaats van een misleidende waarde), zie renderQuestionNotificationEmail
    // (lib/email/templates/question-notification.ts) voor hoe elke rij
    // afzonderlijk alleen getoond wordt als het bijbehorende veld gezet is.
    finish: earsShape ? undefined : data.finish ?? undefined,
    colorName: earsShape ? undefined : color?.name,
    earColorName: earsShape ? earColor?.name : undefined,
    plateColorName: earsShape ? plateColor?.name : undefined,
    sizeName: size.name,
    customText: data.customText,
    extraLine1: data.extraLine1,
    extraLine2: data.extraLine2,
    numberFontName: earsShape ? undefined : numberFont?.name,
    line1FontName: line1Font?.name,
    line2FontName: line2Font?.name,
    askerName: question.name,
    askerEmail: question.email,
    question: question.question,
  });

  try {
    const resend = createResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `Huisnummerbordjes configurator <${fromAddress}>`,
      to: adminEmail,
      replyTo: question.email,
      subject: `Vraag van ${question.name} over een configuratie`,
      html,
    });

    if (error) {
      console.error("Resend-fout (vraag vanuit configurator):", error);
      return NextResponse.json(
        { error: "Versturen van je vraag is mislukt." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Serverfout bij versturen vraag:", err);
    return NextResponse.json(
      { error: "Er ging iets mis op de server." },
      { status: 500 }
    );
  }
}
