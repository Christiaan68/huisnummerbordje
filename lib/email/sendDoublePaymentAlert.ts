import { createResendClient } from "@/lib/email/resend";
import { getSenderFrom } from "@/lib/email/senders";
import { getNotificationEmail } from "@/lib/email/settings";
import type { OrderRow } from "@/lib/mysql/client";

/**
 * Waarschuwing bij een DUBBELE betaling (toegevoegd 23-11-2026, op verzoek
 * van Christiaan). Sinds "Betaling afronden"/"Opnieuw betalen" altijd een
 * nieuwe Mollie-betaling aanmaakt, kan een klant in theorie zowel de oude
 * als de nieuwe betaling voldoen (bv. via een nog open oud tabblad). De
 * bestelling staat dan gewoon op betaald, maar er is twee keer geld binnen.
 *
 * Deze mail gaat ALLEEN naar de webshop zelf (zelfde adres als de interne
 * bestelmelding: E-mailinstellingen → "Bevestigingsmail (nieuwe bestelling)
 * naar"), NOOIT naar de klant. Terugbetalen gebeurt bewust handmatig door
 * de beheerder in het Mollie-dashboard.
 *
 * Gooit nooit een fout: een mislukte waarschuwing mag de webhook niet laten
 * falen (dan zou Mollie blijven herhalen).
 */
export async function sendDoublePaymentAlert(input: {
  order: OrderRow;
  firstPaymentId: string | null;
  secondPaymentId: string;
  secondAmount: string;
}): Promise<void> {
  try {
    const fallback = process.env.ADMIN_EMAIL;
    if (!fallback) {
      console.error("Dubbele betaling: ADMIN_EMAIL ontbreekt, waarschuwing niet verstuurd.");
      return;
    }
    const to = await getNotificationEmail("order_notification", fallback);
    const { order } = input;
    const lines = [
      `Let op: voor bestelling #${order.id} (${order.contact_name}, ${order.contact_email}) is TWEE KEER betaald.`,
      "",
      `Eerste betaling (al verwerkt): ${input.firstPaymentId ?? "onbekend"}`,
      `Tweede betaling: ${input.secondPaymentId} — € ${input.secondAmount}`,
      "",
      "De bestelling staat op betaald; er gaan geen extra mails naar de klant.",
      "Betaal één van de twee betalingen terug via het Mollie-dashboard (Transacties → zoek op het betalingskenmerk → Terugbetalen) en laat de klant dat eventueel weten.",
    ];
    const resend = createResendClient();
    const { error } = await resend.emails.send({
      from: getSenderFrom("orders"),
      to,
      subject: `Dubbele betaling bij bestelling #${order.id} — terugbetalen nodig`,
      text: lines.join("\n"),
    });
    if (error) {
      console.error(`Dubbele betaling #${order.id}: waarschuwingsmail mislukt:`, error);
    }
  } catch (err) {
    console.error(
      `Dubbele betaling #${input.order.id}: waarschuwingsmail mislukt:`,
      err instanceof Error ? err.message : err
    );
  }
}
