import { NextResponse } from "next/server";
import { createMollie } from "@/lib/mollie/client";
import {
  getOrderById,
  confirmOrderManually,
  insertManualConfirmationLog,
} from "@/lib/mysql/client";
import {
  buildAndSendOrderEmailsForOrder,
  OrderEmailBuildError,
} from "@/lib/email/sendPaidOrderEmails";
import {
  isEligibleForManualConfirmation,
  getMollieDelaySeconds,
} from "@/lib/mollie/manualConfirmEligibility";

/**
 * "Order handmatig bevestigen" (toegevoegd 19-9-2026, op verzoek van
 * Christiaan) — wordt aangeroepen door het BEHEERTOOL (een apart project),
 * nooit rechtstreeks door een browser. Het beheertool stuurt hierheen alleen
 * het order-id en de ingetypte naam van de beheerder door; de eigenlijke
 * mail-sjablonen/-logica staan (ongewijzigd) in lib/email/sendPaidOrderEmails.ts
 * — exact dezelfde functie die ook de Mollie-webhook gebruikt.
 *
 * BEVEILIGING: dit adres is bewust NIET met de gewone x-api-key van
 * api/v1/*.js in het beheertool te vergelijken (dat is de andere kant op:
 * webshop -> beheertool). Hier gaat het beheertool JUIST een actie op de
 * webshop uitvoeren (mails versturen namens de webshop), dus een eigen,
 * losse sleutel (ADMIN_TOOL_API_KEY) — nooit naar de browser van de
 * beheerder gestuurd, alleen server-naar-server tussen de twee projecten.
 *
 * BELANGRIJK — waarom dit de ENIGE plek is die echt beslist: de 8-secondenregel
 * wordt hier, vlak vóór het versturen, NOG EEN KEER volledig herberekend op
 * basis van een VERSE opvraging bij Mollie zelf (niet op basis van wat het
 * beheertool toevallig al op het scherm had staan) — een verlopen/gemanipuleerd
 * of verouderd scherm bij de beheerder kan dus nooit een order laten
 * "doorglippen" die niet (meer) aan de voorwaarden voldoet.
 */

interface RequestBody {
  orderId?: unknown;
  confirmedBy?: unknown;
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedApiKey = process.env.ADMIN_TOOL_API_KEY;
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized", message: "Ongeldige of ontbrekende API-key." },
      { status: 401 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", message: "Ongeldig verzoek (geen geldige JSON)." },
      { status: 400 }
    );
  }

  const orderId =
    typeof body.orderId === "number"
      ? body.orderId
      : typeof body.orderId === "string" && body.orderId.trim() !== ""
        ? Number(body.orderId)
        : NaN;
  const confirmedBy =
    typeof body.confirmedBy === "string" ? body.confirmedBy.trim() : "";

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", message: "Ongeldig of ontbrekend orderId." },
      { status: 400 }
    );
  }
  if (!confirmedBy) {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", message: "Naam van de beheerder ontbreekt." },
      { status: 400 }
    );
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      { ok: false, reason: "order-not-found", message: `Bestelling #${orderId} bestaat niet.` },
      { status: 404 }
    );
  }

  if (!order.mollie_payment_id) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no-mollie-payment",
        message: `Bestelling #${orderId} heeft geen Mollie-betaling gekoppeld.`,
      },
      { status: 409 }
    );
  }

  // Altijd vers bij Mollie zelf opvragen — nooit vertrouwen op wat het
  // beheertool eerder al liet zien, zie de toelichting bovenaan dit bestand.
  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(order.mollie_payment_id);
  } catch (err) {
    console.error(
      `resend-order-emails: kon betaling ${order.mollie_payment_id} (order #${orderId}) niet bij Mollie opvragen:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      {
        ok: false,
        reason: "mollie-lookup-failed",
        message: "Kon de betaling niet bij Mollie opvragen.",
      },
      { status: 502 }
    );
  }

  if (payment.status !== "paid") {
    return NextResponse.json(
      {
        ok: false,
        reason: "not-paid",
        message: `Deze betaling staat bij Mollie niet (meer) op 'paid' (huidige status: ${payment.status}).`,
      },
      { status: 409 }
    );
  }

  const alreadyConfirmed = order.manually_confirmed_at !== null;
  const eligible = isEligibleForManualConfirmation({
    paymentStatus: payment.status,
    mollieCreatedAt: payment.createdAt,
    molliePaidAt: payment.paidAt,
    alreadyConfirmed,
  });
  const delaySeconds = getMollieDelaySeconds(payment.createdAt, payment.paidAt);

  if (!eligible) {
    const reason = alreadyConfirmed
      ? "already-confirmed"
      : delaySeconds === null
        ? "timestamps-missing"
        : "delay-not-exceeded";
    const message = alreadyConfirmed
      ? "Deze bestelling is al eerder handmatig bevestigd."
      : delaySeconds === null
        ? "De benodigde Mollie-tijdstippen zijn niet (betrouwbaar) bekend voor deze betaling."
        : `De vertraging (${delaySeconds.toFixed(1)} sec.) is niet groter dan 8,0 seconden.`;
    return NextResponse.json({ ok: false, reason, message }, { status: 409 });
  }

  // Vanaf hier: "claimen" vóórdat er ook maar geprobeerd wordt een mail te
  // versturen (zie confirmOrderManually in lib/mysql/client.ts) — zo kan een
  // dubbelklik, gelijktijdige aanvraag van een 2e beheerder, of een herhaald
  // verzoek nooit tot dubbele mails leiden. Wint deze aanvraag de claim niet
  // (een andere aanvraag was net iets sneller), dan wordt hier gestopt zonder
  // ook maar iets te versturen.
  const claimed = await confirmOrderManually(orderId, confirmedBy);
  if (!claimed) {
    return NextResponse.json(
      {
        ok: false,
        reason: "already-confirmed",
        message: "Deze bestelling is zojuist al (door iemand anders) handmatig bevestigd.",
      },
      { status: 409 }
    );
  }

  const mollieCreatedAtDate = payment.createdAt ? new Date(payment.createdAt) : null;
  const molliePaidAtDate = payment.paidAt ? new Date(payment.paidAt) : null;
  const paymentMethodName = null; // niet nodig voor de mailtekst hier (staat al op de order)

  let internalEmailSent = false;
  let customerEmailSent = false;
  let errorMessage: string | null = null;

  try {
    const result = await buildAndSendOrderEmailsForOrder(
      order,
      order.payment_method_name ?? paymentMethodName,
      payment.paidAt ?? null
    );
    internalEmailSent = result.internalEmailSent;
    customerEmailSent = result.customerEmailSent;
    if (!internalEmailSent || !customerEmailSent) {
      errorMessage = `Niet alle mails zijn gelukt (intern: ${internalEmailSent}, klant: ${customerEmailSent}).`;
    }
  } catch (err) {
    if (err instanceof OrderEmailBuildError) {
      errorMessage = `Mails konden niet opgebouwd worden (${err.reason}): ${err.message}`;
    } else {
      errorMessage = `Onverwachte fout bij het versturen van de mails: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
    console.error(`resend-order-emails: order #${orderId} — ${errorMessage}`);
  }

  await insertManualConfirmationLog({
    orderId,
    molliePaymentId: order.mollie_payment_id,
    mollieCreatedAt: mollieCreatedAtDate,
    molliePaidAt: molliePaidAtDate,
    delaySeconds,
    confirmedBy,
    internalEmailSent,
    customerEmailSent,
    errorMessage,
  });

  // De bevestiging zelf staat al vast (geclaimd, hierboven) — dat wordt nooit
  // teruggedraaid, ook niet bij een mislukte mail. Maar een gedeeltelijke
  // mislukking mag NOOIT als volledig succes teruggemeld worden aan het
  // beheertool: ok:false + duidelijke reden, met de wél al geregistreerde
  // bevestiging zichtbaar in de auditlog hierboven.
  if (!internalEmailSent || !customerEmailSent) {
    return NextResponse.json(
      {
        ok: false,
        reason: "emails-partially-failed",
        message: errorMessage ?? "Niet alle mails zijn verstuurd.",
        internalEmailSent,
        customerEmailSent,
        delaySeconds,
      },
      { status: 207 }
    );
  }

  return NextResponse.json({
    ok: true,
    internalEmailSent,
    customerEmailSent,
    delaySeconds,
  });
}
