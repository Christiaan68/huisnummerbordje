import { NextResponse } from "next/server";
import { paymentIssueQuestionSchema } from "@/lib/validation/payment-issue.schema";
import { createResendClient } from "@/lib/email/resend";
import { getNotificationEmail } from "@/lib/email/settings";
import { renderPaymentIssueNotificationEmail } from "@/lib/email/templates/payment-issue-notification";
import { formatEuroFromCents } from "@/lib/format/euro";
import { getOrderById } from "@/lib/mysql/client";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "in behandeling",
  paid: "betaald",
  failed: "mislukt",
  expired: "verlopen",
  canceled: "geannuleerd",
};

/**
 * Verwerkt een vraag over een bestaande bestelling, gesteld vanaf de
 * bedankt-pagina (zie components/order/PaymentIssueContact.tsx en
 * app/bestelling/bedankt/page.tsx) — met name bedoeld voor als de betaling
 * langer op zich laat wachten dan verwacht. Toegevoegd 16-9-2026, op
 * verzoek van Christiaan.
 *
 * Anders dan het bestaande "vraag stellen"-formulier (app/api/
 * contact-question/route.ts) vertrouwt deze route NOOIT de bestelgegevens
 * die de browser meestuurt: alleen orderId + de vraag zelf komen van de
 * client, de rest (naam, adres, configuratie, prijs, betaalstatus) wordt
 * hier zelf opnieuw uit de database opgehaald — zo kan iemand nooit
 * verzonnen bestelgegevens in de mail aan Christiaan laten zetten.
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

  const parsed = paymentIssueQuestionSchema.safeParse(body);
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

  const { orderId, question } = parsed.data;
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Bestelling niet gevonden." }, { status: 404 });
  }

  const paymentStatusLabel =
    PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status;

  // Terugvaladres als er in de prijstool nog niets is ingesteld onder
  // "Vraag betaalprobleem naar": op uitdrukkelijk verzoek van Christiaan
  // letterlijk zijn eigen adres, ongeacht wat ADMIN_EMAIL toevallig is —
  // zie lib/email-settings.js in de prijstool voor de instelling zelf.
  const adminEmail = await getNotificationEmail(
    "payment_issue_notification",
    "christiaan@tenhaaken.nl"
  );

  const html = renderPaymentIssueNotificationEmail({
    orderId: order.id,
    paymentStatusLabel,
    contactName: order.contact_name,
    contactEmail: order.contact_email,
    contactPhone: order.contact_phone ?? undefined,
    contactAddress: order.contact_address,
    contactPostalCode: order.contact_postal_code,
    contactCity: order.contact_city,
    shapeName: order.shape_name,
    finish: order.finish,
    colorName: order.color_name ?? undefined,
    printColorName: order.print_color_name ?? undefined,
    earColorName: order.ear_color_name ?? undefined,
    plateColorName: order.plate_color_name ?? undefined,
    sizeName: order.size_name,
    customText: order.custom_text,
    extraLine1: order.extra_line_1 ?? undefined,
    extraLine2: order.extra_line_2 ?? undefined,
    priceLabel: formatEuroFromCents(order.price_total_cents),
    question,
  });

  try {
    const resend = createResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `Huisnummerbordjes bestelling <${fromAddress}>`,
      to: adminEmail,
      replyTo: order.contact_email,
      subject: `Vraag over bestelling #${order.id} (betaling ${paymentStatusLabel})`,
      html,
    });

    if (error) {
      console.error("Resend-fout (vraag over bestelling/betaalprobleem):", error);
      return NextResponse.json(
        { error: "Versturen van je vraag is mislukt." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Serverfout bij versturen vraag over bestelling:", err);
    return NextResponse.json(
      { error: "Er ging iets mis op de server." },
      { status: 500 }
    );
  }
}
