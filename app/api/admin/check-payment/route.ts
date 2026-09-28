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
 * "Check bij Mollie" in het beheertool — bestond al als knop maar riep een
 * route aan die nooit gebouwd was (ontdekt en hersteld 28-9-2026, samen met
 * "Toch mails versturen" hieronder). Bedoeld voor het geval dat Mollie's
 * eigen automatische melding (de webhook, zie app/api/mollie-webhook/
 * route.ts) een keer niet aankwam — dan blijft een bestelling in onze
 * database op 'pending' staan, terwijl Mollie zelf allang een eindstatus
 * heeft. Deze route vraagt die status VERS bij Mollie zelf op en verwerkt
 * 'm daarna op EXACT dezelfde manier als de webhook dat zelf zou doen
 * (zelfde databasefuncties, zelfde mailfunctie) — bewust als aparte kopie
 * van die verwerkingsstappen in plaats van de webhook-route zelf aan te
 * roepen, om niets aan die al werkende, kritieke route te hoeven wijzigen.
 *
 * Nooit een eigen "forceer betaald"-actie: alleen wat Mollie zelf meldt
 * wordt overgenomen. Staat de betaling bij Mollie nog niet definitief (bv.
 * 'open'/'pending'/'authorized'), dan gebeurt hier niets en meldt deze route
 * dat gewoon terug.
 */

interface RequestBody {
  orderId?: unknown;
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

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", message: "Ongeldig of ontbrekend orderId." },
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

  // Was deze bestelling bij ons al op een eindstatus gezet (bijvoorbeeld
  // doordat de webhook toch nog gewerkt heeft vlak voordat er hier
  // gecontroleerd werd), dan hoeft er niets meer te gebeuren.
  if (order.payment_status !== "pending" && order.payment_status !== "expired") {
    return NextResponse.json({
      ok: true,
      status: order.payment_status,
      message: `Deze bestelling staat bij ons al op '${order.payment_status}' — niets te verwerken.`,
    });
  }

  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(order.mollie_payment_id);
  } catch (err) {
    console.error(
      `check-payment: kon betaling ${order.mollie_payment_id} (order #${orderId}) niet bij Mollie opvragen:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { ok: false, reason: "mollie-lookup-failed", message: "Kon de betaling niet bij Mollie opvragen." },
      { status: 502 }
    );
  }

  const paymentMethodName = payment.method ? getPaymentMethodLabel(payment.method) : null;
  const paymentDetails = payment.details as Record<string, string | undefined> | undefined;
  const paymentBankName = getBankName(paymentDetails?.consumerBic);

  if (payment.status === "paid") {
    try {
      await markOrderAsPaid(
        orderId,
        order.mollie_payment_id,
        paymentMethodName,
        paymentBankName,
        payment.paidAt ? new Date(payment.paidAt) : null
      );
    } catch (err) {
      console.error(`check-payment: kon bestelling #${orderId} niet op 'paid' zetten:`, err);
      return NextResponse.json(
        { ok: false, reason: "update-failed", message: "Kon bestelling niet bijwerken." },
        { status: 500 }
      );
    }

    try {
      const result = await buildAndSendOrderEmailsForOrder(order, paymentMethodName, payment.paidAt ?? null);
      if (!result.internalEmailSent || !result.customerEmailSent) {
        return NextResponse.json({
          ok: false,
          reason: "emails-partially-failed",
          status: "paid",
          message: `Bestelling is betaald bij Mollie, maar niet alle mails zijn gelukt (intern: ${result.internalEmailSent}, klant: ${result.customerEmailSent}).`,
        });
      }
    } catch (err) {
      const message =
        err instanceof OrderEmailBuildError
          ? `Bestelling is betaald bij Mollie, maar de mails konden niet opgebouwd worden (${err.reason}): ${err.message}`
          : `Bestelling is betaald bij Mollie, maar het versturen van de mails is onverwacht mislukt: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`check-payment: order #${orderId} — ${message}`);
      return NextResponse.json({ ok: false, reason: "emails-failed", status: "paid", message });
    }

    return NextResponse.json({
      ok: true,
      status: "paid",
      message: "Mollie meldt deze betaling nu als betaald — de bevestigingsmails zijn alsnog verstuurd.",
    });
  }

  if (payment.status === "failed" || payment.status === "expired" || payment.status === "canceled") {
    const paymentFailureReason = getFailureReasonLabel(paymentDetails?.failureReason);
    try {
      await updateOrderPaymentStatus(
        orderId,
        payment.status,
        order.mollie_payment_id,
        paymentMethodName,
        paymentBankName,
        paymentFailureReason
      );
    } catch (err) {
      console.error(`check-payment: kon bestelling #${orderId} niet op '${payment.status}' zetten:`, err);
      return NextResponse.json(
        { ok: false, reason: "update-failed", message: "Kon bestelling niet bijwerken." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      status: payment.status,
      message: `Mollie meldt deze betaling nu als '${payment.status}'.`,
    });
  }

  // Nog geen eindstatus bij Mollie (bv. 'open'/'pending'/'authorized').
  return NextResponse.json({
    ok: true,
    status: payment.status,
    message: `Bij Mollie staat deze betaling nog niet definitief (status: ${payment.status}).`,
  });
}
