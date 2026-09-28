import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/mysql/client";
import { createMolliePaymentForOrder, getSiteUrl } from "@/lib/mollie/client";

/**
 * Link "Alsnog betalen" in de "betaling verlopen"-mail (zie
 * lib/email/templates/payment-expired-notification.ts en
 * app/api/admin/report-expired-order/route.ts) — een klant klikt hier
 * rechtstreeks op vanuit zijn mailprogramma, dus GEEN API-sleutel nodig
 * (zelfde uitgangspunt als de bestaande /bestelling/bedankt?order=X-link:
 * ook die staat zonder los geheim in mails die klanten ontvangen).
 *
 * Hergebruikt createMolliePaymentForOrder (lib/mollie/client.ts) — exact
 * dezelfde Mollie-aanroep als de eerste, normale betaalpoging
 * (app/api/create-payment/route.ts) — met de AL OPGESLAGEN NAW-gegevens,
 * configuratie en prijs van deze order: de klant hoeft dus niets opnieuw in
 * te vullen.
 *
 * Bij elk geval waarin er GEEN nieuwe betaling gestart mag worden (order
 * niet gevonden, al betaald, of geen "verlopen"-status (meer)) wordt bewust
 * doorgestuurd naar de bestaande bedankt-pagina (app/bestelling/bedankt/
 * page.tsx) — die toont op basis van de actuele status al precies de juiste
 * melding ("niet gevonden" / "betaling gelukt" / enz.), dus hier geen
 * tweede, eigen foutpagina nodig.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = Number(params.id);
  const siteUrl = getSiteUrl();
  const bedanktUrl = `${siteUrl}/bestelling/bedankt?order=${encodeURIComponent(params.id)}`;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.redirect(bedanktUrl);
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.redirect(bedanktUrl);
  }

  // Al betaald (bv. de klant klikte de link twee keer, of betaalde
  // ondertussen via een andere weg) — nooit een tweede betaling starten,
  // de bedankt-pagina toont dan gewoon "betaling gelukt". Uitgebreid
  // 30-9-2026 met "failed" (naast "expired"): sinds die datum kan deze link
  // ook in een "betaling mislukt"-mail staan (zie report-expired-order/
  // route.ts), voor een betaling die Mollie zelf als mislukt afwijst (bv.
  // een geweigerde creditcard) — ook dan mag de klant het gewoon nog eens
  // proberen.
  if (order.payment_status !== "expired" && order.payment_status !== "failed") {
    return NextResponse.redirect(bedanktUrl);
  }

  if (order.price_total_cents === null || order.price_total_cents <= 0) {
    console.error(
      `retry-payment: order #${orderId} heeft geen (geldige) prijs, kan geen nieuwe betaling starten.`
    );
    return NextResponse.redirect(bedanktUrl);
  }

  try {
    const { checkoutUrl } = await createMolliePaymentForOrder(
      order.id,
      order.price_total_cents
    );
    return NextResponse.redirect(checkoutUrl);
  } catch (err) {
    console.error(
      `retry-payment: aanmaken nieuwe Mollie-betaling voor order #${orderId} is mislukt:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.redirect(bedanktUrl);
  }
}
