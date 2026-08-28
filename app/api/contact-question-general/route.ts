import { NextResponse } from "next/server";
import { questionDetailsSchema } from "@/lib/validation/question.schema";
import { createResendClient } from "@/lib/email/resend";
import { getNotificationEmail } from "@/lib/email/settings";
import { renderQuestionNotificationEmail } from "@/lib/email/templates/question-notification";

/**
 * Verwerkt een algemene vraag via het contactformulier op /contact/vraag
 * (zie components/contact/ContactQuestionForm.tsx) — dus NIET gekoppeld aan
 * een configuratie in uitvoering. Voor de vraag-pop-up die vanuit de
 * configurator zelf een vraag stuurt (mét de op dat moment gekozen
 * configuratie erbij), zie app/api/contact-question/route.ts. Beide routes
 * sturen naar hetzelfde e-mailadres: de instelling "Vraag klant naar"
 * (question_notification) uit de prijstool.
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

  const parsed = questionDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
  const question = parsed.data;

  const fallbackAdminEmail = process.env.ADMIN_EMAIL;
  if (!fallbackAdminEmail) {
    console.error("ADMIN_EMAIL ontbreekt in de environment variables.");
    return NextResponse.json(
      { error: "E-mailconfiguratie ontbreekt op de server." },
      { status: 500 }
    );
  }
  // Zelfde instelling als de configurator-vraag (app/api/contact-question/
  // route.ts) — bij voorkeur het adres uit "E-mailinstellingen" in de
  // prijstool (label "Vraag klant naar"), anders ADMIN_EMAIL als terugval.
  const adminEmail = await getNotificationEmail(
    "question_notification",
    fallbackAdminEmail
  );

  const html = renderQuestionNotificationEmail({
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
      subject: `Vraag van ${question.name} via het contactformulier`,
      html,
    });

    if (error) {
      console.error("Resend-fout (algemene contactvraag):", error);
      return NextResponse.json(
        { error: "Versturen van je vraag is mislukt." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Serverfout bij versturen contactvraag:", err);
    return NextResponse.json(
      { error: "Er ging iets mis op de server." },
      { status: 500 }
    );
  }
}
