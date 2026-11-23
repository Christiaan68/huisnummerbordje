import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/mysql/client";
import { createMollie, createMolliePaymentForOrder, getSiteUrl } from "@/lib/mollie/client";

// Nooit cachen: elke klik moet de actuele status bij Mollie opvragen.
export const dynamic = "force-dynamic";

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
      // Altijd een NIEUWE betaling aanmaken (23-11-2026, na test door
      // Christiaan). Terugsturen naar de bestaande betaling werkte niet
      // betrouwbaar: na "Mislukt" + "Vorige pagina" verwerkt Mollie het
      // afbreken pas na een paar seconden; tot dan staat de betaling nog op
      // "open", maar stuurt Mollie de oude betaallink meteen terug naar de
      // webshop. De oude betaling wordt waar mogelijk geannuleerd; een late
      // melding van die oude betaling wordt door de webhook genegeerd
      // (order.mollie_payment_id wijst dan naar de nieuwe betaling).
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
        `resume-payment: order #${orderId}, oude Mollie-status "${payment.status}" — nieuwe betaling wordt aangemaakt.`
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
