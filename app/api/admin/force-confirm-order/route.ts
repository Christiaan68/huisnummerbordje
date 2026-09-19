import { NextResponse } from "next/server";
import { createMollie } from "@/lib/mollie/client";
import {
  getOrderById,
  forceConfirmOrderWithoutMolliePaid,
  insertManualConfirmationLog,
} from "@/lib/mysql/client";
import {
  buildAndSendOrderEmailsForOrder,
  OrderEmailBuildError,
} from "@/lib/email/sendPaidOrderEmails";
import { getPaymentMethodLabel } from "@/lib/mollie/client";
import { applyMolliePaymentStatusToOrder } from "@/lib/mollie/applyMolliePaymentStatus";

/**
 * "Toch mails versturen" (toegevoegd 19-9-2026, later dezelfde dag als
 * "Order handmatig bevestigen" en "Check bij Mollie" hiernaast) — de
 * bewuste HANDMATIGE OVERSCHRIJVING: een beheerder bevestigt een order die
 * bij Mollie nog 'open'/'pending' of 'expired' staat, bijvoorbeeld omdat de
 * klant buiten Mollie om toch aantoonbaar betaald heeft. Op verzoek van
 * Christiaan alleen bereikbaar NADAT eerst "Check bij Mollie"
 * (check-order-payment/route.ts) is gebruikt en dat nog steeds geen
 * definitieve bevestiging opleverde.
 *
 * Nadrukkelijk NIET toegestaan voor een betaling die Mollie zelf als
 * 'failed' of 'canceled' meldt (dat is, anders dan 'open'/'pending'/
 * 'expired', een ondubbelzinnige eindstatus — "als Mollie aan kan geven of
 * de betaling mislukt is of geannuleerd, dan hoeft er geen knop bij").
 *
 * Vraagt, net als resend-order-emails hiernaast, ALTIJD eerst vers bij
 * Mollie zelf op wat de status is — nooit vertrouwen op wat het beheertool
 * toonde. Blijkt de betaling ondertussen (net) alsnog 'paid', 'failed',
 * 'expired' of 'canceled' te zijn geworden, dan wordt dat gewoon via de
 * normale weg (lib/mollie/applyMolliePaymentStatus.ts) verwerkt in plaats
 * van de overschrijving — de overschrijving zelf is dus ALLEEN voor het
 * geval de betaling nog echt onopgelost is.
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
  if (order.manually_confirmed_at !== null) {
    return NextResponse.json(
      {
        ok: false,
        reason: "already-confirmed",
        message: "Deze bestelling is al eerder handmatig bevestigd.",
      },
      { status: 409 }
    );
  }
  if (order.payment_status === "paid") {
    return NextResponse.json(
      {
        ok: false,
        reason: "already-paid",
        message: "Deze bestelling staat al op 'betaald' — een overschrijving is hier niet (meer) nodig.",
      },
      { status: 409 }
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
  // beheertool eerder al liet zien ("Check bij Mollie" kan alweer even
  // geleden zijn aangeroepen).
  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(order.mollie_payment_id);
  } catch (err) {
    console.error(
      `force-confirm-order: kon betaling ${order.mollie_payment_id} (order #${orderId}) niet bij Mollie opvragen:`,
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

  // Blijkt de betaling ondertussen alsnog 'paid'/'failed'/'expired'/
  // 'canceled' te zijn geworden, dan is dit GEEN overschrijving meer nodig —
  // gewoon via de normale weg verwerken en dat teruggeven, in plaats van de
  // hieronder volgende, bewust zwaardere overschrijvingsstap uit te voeren.
  if (payment.status !== "open" && payment.status !== "pending" && payment.status !== "authorized") {
    const outcome = await applyMolliePaymentStatusToOrder(order, payment);
    if (outcome.kind === "paid") {
      return NextResponse.json({
        ok: true,
        status: "paid",
        forcedOverride: false,
        message:
          "Mollie meldt inmiddels dat de betaling wél gelukt is — de bevestigingsmails zijn via de normale weg verstuurd, een overschrijving was niet nodig.",
        internalEmailSent: outcome.internalEmailSent,
        customerEmailSent: outcome.customerEmailSent,
      });
    }
    if (outcome.kind === "failed-or-canceled") {
      const labels: Record<string, string> = {
        failed: "mislukt",
        expired: "verlopen",
        canceled: "geannuleerd",
      };
      return NextResponse.json(
        {
          ok: false,
          reason: "failed-or-canceled",
          status: outcome.status,
          message: `Mollie geeft aan dat deze betaling ${labels[outcome.status] ?? outcome.status} is — een handmatige overschrijving is hiervoor niet bedoeld.`,
        },
        { status: 409 }
      );
    }
  }

  // Vanaf hier: de betaling staat bij Mollie nog steeds op een niet-
  // definitieve status ('open'/'pending'/'authorized') — dit is de bewuste
  // overschrijving. Claimen vóórdat er geprobeerd wordt een mail te
  // versturen, zelfde reden als bij resend-order-emails hiernaast.
  const claimed = await forceConfirmOrderWithoutMolliePaid(orderId, confirmedBy);
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

  const paymentMethodName = payment.method
    ? getPaymentMethodLabel(payment.method)
    : (order.payment_method_name ?? null);

  let internalEmailSent = false;
  let customerEmailSent = false;
  let errorMessage: string | null = null;

  try {
    const result = await buildAndSendOrderEmailsForOrder(order, paymentMethodName, null);
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
    console.error(`force-confirm-order: order #${orderId} — ${errorMessage}`);
  }

  await insertManualConfirmationLog({
    orderId,
    molliePaymentId: order.mollie_payment_id,
    mollieCreatedAt: payment.createdAt ? new Date(payment.createdAt) : null,
    molliePaidAt: null,
    delaySeconds: null,
    confirmedBy,
    internalEmailSent,
    customerEmailSent,
    errorMessage,
    mollieStatusAtConfirmation: payment.status,
  });

  if (!internalEmailSent || !customerEmailSent) {
    return NextResponse.json(
      {
        ok: false,
        reason: "emails-partially-failed",
        forcedOverride: true,
        message: errorMessage ?? "Niet alle mails zijn verstuurd.",
        internalEmailSent,
        customerEmailSent,
      },
      { status: 207 }
    );
  }

  return NextResponse.json({
    ok: true,
    forcedOverride: true,
    internalEmailSent,
    customerEmailSent,
    message: "Bestelling handmatig bevestigd (ondanks dat Mollie de betaling zelf niet bevestigt) — de mails zijn verstuurd.",
  });
}
