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
    "question_notification",
    fallbackAdminEmail
  );

  const html = renderQuestionNotificationEmail({
    shapeName: shape.name,
    finish: data.finish,
    colorName: color.name,
    sizeName: size.name,
    customText: data.customText,
    extraLine1: data.extraLine1,
    extraLine2: data.extraLine2,
    fontName: font.name,
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
