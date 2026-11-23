import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/mysql/client";
import { createMollie, createMolliePaymentForOrder, getSiteUrl } from "@/lib/mollie/client";

/**
 * B7 (testrapport 22-11-2026): knop "Betaling afronden" op de bedankpagina,
 * voor een klant die bij Mollie is afgehaakt of het opnieuw wil proberen.
 *
 * - Al betaald (in de database of bij Mollie): terug naar de bedankpagina.
 * - Mollie-betaling staat nog open en heeft een betaallink: daarheen.
 * - Anders (mislukt, geannuleerd, verlopen, of geen betaallink meer): een
 *   nieuwe Mollie-betaling voor dezelfde bestelling en hetzelfde bedrag
 *   (zelfde aanpak als de bestaande retry-payment-route).
 *
 * Een oude betaling die later alsnog verloopt, overschrijft de bestelling
 * niet meer: zie de controle op mollie_payment_id in de webhook.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = Number(params.id);
  const bedanktUrl = `${getSiteUrl()}/bestelling/bedankt?order=${encodeURIComponent(params.id)}`;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.redirect(bedanktUrl);
  }

  const order = await getOrderById(orderId);
  if (!order || order.payment_status === "paid") {
    return NextResponse.redirect(bedanktUrl);
  }

  if (order.mollie_payment_id) {
    try {
      const payment = await createMollie().payments.get(order.mollie_payment_id);
      if (payment.status === "paid") {
        return NextResponse.redirect(bedanktUrl);
      }
      const checkoutUrl = payment._links.checkout?.href;
      // Alleen terug naar de bestaande betaling als daar nog geen
      // betaalmethode is geprobeerd. Is er al een methode gekozen (bv. een
      // mislukte poging, waarna de klant via "Vorige pagina" terugkwam), dan
      // stuurt Mollie de bestaande betaallink vaak meteen terug naar de
      // webshop. Dan maken we direct een nieuwe betaling aan (23-11-2026,
      // gevonden door Christiaan: eerste klik kwam terug op dezelfde pagina).
      if (payment.status === "open" && checkoutUrl && !payment.method) {
        return NextResponse.redirect(checkoutUrl);
      }
      if (payment.status === "open" && payment.isCancelable) {
        try {
          await createMollie().payments.cancel(payment.id);
        } catch (err) {
          console.warn(
            `resume-payment: oude betaling ${payment.id} (order #${orderId}) kon niet geannuleerd worden:`,
            err instanceof Error ? err.message : err
          );
        }
      }
      console.log(
        `resume-payment: order #${orderId}, Mollie-status "${payment.status}", betaallink ${
          checkoutUrl ? "aanwezig" : "ontbreekt"
        } — nieuwe betaling wordt aangemaakt.`
      );
    } catch (err) {
      console.error(
        `resume-payment: Mollie-betaling van order #${orderId} kon niet opgevraagd worden:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  if (order.price_total_cents === null || order.price_total_cents <= 0) {
    return NextResponse.redirect(bedanktUrl);
  }

  try {
    const { checkoutUrl } = await createMolliePaymentForOrder(order.id, order.price_total_cents);
    return NextResponse.redirect(checkoutUrl);
  } catch (err) {
    console.error(
      `resume-payment: nieuwe Mollie-betaling voor order #${orderId} is mislukt:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.redirect(bedanktUrl);
  }
}
