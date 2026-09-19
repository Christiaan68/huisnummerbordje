import { NextResponse } from "next/server";
import {
  createMollie,
  getPaymentMethodLabel,
  getBankName,
  getFailureReasonLabel,
} from "@/lib/mollie/client";
import {
  getOrderById,
  markOrderAsPaid,
  updateOrderPaymentStatus,
} from "@/lib/mysql/client";
import {
  buildAndSendOrderEmailsForOrder,
  OrderEmailBuildError,
} from "@/lib/email/sendPaidOrderEmails";

/**
 * Ontvangt Mollie's betaalbevestigingen ("webhook"), toegevoegd 29-8-2026.
 * Mollie stuurt hier NOOIT de betaalstatus zelf naartoe — alleen een id
 * (als een gewoon formulierveld, geen JSON). De enige betrouwbare manier om
 * de status te weten te komen is 'm met dat id bij Mollie zelf opvragen,
 * dat gebeurt hieronder. Zo kan een vervalst berichtje aan dit adres nooit
 * een bestelling als betaald laten doorgaan.
 *
 * Mollie roept dit adres soms meerdere keren aan voor dezelfde betaling
 * (bijvoorbeeld bij een trage/mislukte eerdere poging) — deze route houdt
 * daar rekening mee (zie de "already"-check hieronder) en negeert een
 * herhaalde melding voor een bestelling die al als betaald geregistreerd
 * staat.
 *
 * Mollie verwacht binnen 15 seconden een 200-antwoord. Lukt de verwerking
 * niet door een onverwachte (technische) fout, dan geeft deze route bewust
 * GEEN 200 terug — Mollie probeert het dan vanzelf later opnieuw (tot 10
 * pogingen, verspreid over 26 uur). Bij een verwacht/afgehandeld geval
 * (bv. een niet-bestaande bestelling) wordt wél 200 teruggegeven, want een
 * volgende poging zou daar toch niets aan veranderen.
 */
export async function POST(request: Request) {
  let paymentId: string | null = null;
  try {
    const formData = await request.formData();
    const idValue = formData.get("id");
    paymentId = typeof idValue === "string" ? idValue : null;
  } catch (err) {
    console.error(
      "Mollie-webhook: kon het verzoek niet lezen:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (!paymentId) {
    console.error("Mollie-webhook: geen 'id' meegekregen.");
    return NextResponse.json({ error: "Geen id meegekregen." }, { status: 400 });
  }

  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(paymentId);
  } catch (err) {
    console.error(
      `Mollie-webhook: kon betaling ${paymentId} niet bij Mollie opvragen:`,
      err instanceof Error ? err.message : err
    );
    // Onbekend of dit een tijdelijk (netwerk-)probleem is — geen 200, zodat
    // Mollie het later opnieuw probeert.
    return NextResponse.json({ error: "Kon betaling niet opvragen." }, { status: 500 });
  }

  const orderIdRaw = payment.metadata && (payment.metadata as { orderId?: string }).orderId;
  const orderId = orderIdRaw ? Number(orderIdRaw) : NaN;
  if (!orderIdRaw || Number.isNaN(orderId)) {
    console.error(
      `Mollie-webhook: betaling ${paymentId} heeft geen (geldig) orderId in de metadata — kan niet gekoppeld worden aan een bestelling.`
    );
    return NextResponse.json({ received: true });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    console.error(
      `Mollie-webhook: bestelling #${orderId} (bij betaling ${paymentId}) bestaat niet (meer) in de database.`
    );
    return NextResponse.json({ received: true });
  }

  // Idempotentie: Mollie kan dit adres meerdere keren aanroepen voor
  // dezelfde betaling — een bestelling die al als betaald geregistreerd
  // staat, mag nooit een 2e keer de mails laten versturen.
  if (order.payment_status === "paid") {
    return NextResponse.json({ received: true, already: "paid" });
  }

  // Mollie's `details`-veld bevat, afhankelijk van de betaalmethode, extra
  // informatie (bv. de bank bij iDEAL via consumerBic, of een foutreden bij
  // een afgewezen creditcard via failureReason) — de precieze vorm
  // verschilt per methode, daarom hier bewust losjes getypeerd in plaats
  // van Mollie's eigen (per-methode wisselende) detail-types over te nemen.
  // Toegevoegd 16-9-2026, op verzoek van Christiaan, zodat het beheertool
  // deze gegevens per order kan tonen.
  const paymentMethodName = payment.method ? getPaymentMethodLabel(payment.method) : null;
  const paymentDetails = payment.details as Record<string, string | undefined> | undefined;
  const paymentBankName = getBankName(paymentDetails?.consumerBic);

  if (payment.status === "paid") {
    try {
      // payment.paidAt (toegevoegd 19-9-2026, voor "Order handmatig
      // bevestigen" in het beheertool) wordt hier als `Date` doorgegeven —
      // zie de toelichting bij markOrderAsPaid (lib/mysql/client.ts) voor
      // waarom dit een ANDER, eigen kolom is dan de bestaande `paid_at`.
      await markOrderAsPaid(
        orderId,
        paymentId,
        paymentMethodName,
        paymentBankName,
        payment.paidAt ? new Date(payment.paidAt) : null
      );
    } catch (err) {
      console.error(
        `Mollie-webhook: kon bestelling #${orderId} niet op 'paid' zetten:`,
        err instanceof Error ? err.message : err
      );
      return NextResponse.json({ error: "Kon bestelling niet bijwerken." }, { status: 500 });
    }

    // De opbouw van de mail-invoer (vorm/maat/kleur opnieuw opzoeken,
    // sjablonen vullen, versturen) staat sinds 19-9-2026 in een gedeelde
    // functie (lib/email/sendPaidOrderEmails.ts) — dezelfde functie die ook
    // app/api/admin/resend-order-emails/route.ts gebruikt voor een
    // handmatige bevestiging, zodat er nooit twee losse implementaties van
    // dezelfde mails kunnen ontstaan.
    try {
      const result = await buildAndSendOrderEmailsForOrder(
        order,
        paymentMethodName,
        payment.paidAt ?? null
      );

      if (!result.internalEmailSent || !result.customerEmailSent) {
        console.error(
          `Mollie-webhook: bestelling #${orderId} is betaald, maar niet alle mails zijn gelukt (intern: ${result.internalEmailSent}, klant: ${result.customerEmailSent}) — zie de foutmeldingen hierboven.`
        );
      }
    } catch (err) {
      if (err instanceof OrderEmailBuildError) {
        console.error(
          `Mollie-webhook: bestelling #${orderId} is betaald, maar de mails konden niet opgebouwd worden (${err.reason}): ${err.message} — mails NIET verstuurd. Handmatig navragen bij de klant is nodig.`
        );
        return NextResponse.json({ received: true, warning: err.reason });
      }
      console.error(
        `Mollie-webhook: bestelling #${orderId} is betaald, maar het versturen van de mails is onverwacht mislukt:`,
        err instanceof Error ? err.message : err
      );
      // De betaling staat al goed geregistreerd (payment_status = 'paid'),
      // dat is het belangrijkste — een 200 hier voorkomt dat Mollie het
      // blijft proberen voor iets wat toch al gelukt is (de betaling zelf).
      return NextResponse.json({ received: true, warning: "emails-failed" });
    }

    return NextResponse.json({ received: true });
  }

  if (
    payment.status === "failed" ||
    payment.status === "expired" ||
    payment.status === "canceled"
  ) {
    const paymentFailureReason = getFailureReasonLabel(paymentDetails?.failureReason);
    try {
      await updateOrderPaymentStatus(
        orderId,
        payment.status,
        paymentId,
        paymentMethodName,
        paymentBankName,
        paymentFailureReason
      );
    } catch (err) {
      console.error(
        `Mollie-webhook: kon bestelling #${orderId} niet op '${payment.status}' zetten:`,
        err instanceof Error ? err.message : err
      );
      return NextResponse.json({ error: "Kon bestelling niet bijwerken." }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  // Overige, niet-eindstatussen (bv. "open", "pending", "authorized"):
  // niets te doen, Mollie roept dit adres later opnieuw aan zodra er een
  // definitieve status is.
  return NextResponse.json({ received: true });
}
