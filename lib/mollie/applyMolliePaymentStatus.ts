import {
  getPaymentMethodLabel,
  getBankName,
  getFailureReasonLabel,
} from "@/lib/mollie/client";
import {
  markOrderAsPaid,
  updateOrderPaymentStatus,
  type OrderRow,
} from "@/lib/mysql/client";
import {
  buildAndSendOrderEmailsForOrder,
  OrderEmailBuildError,
} from "@/lib/email/sendPaidOrderEmails";

/**
 * Gedeelde afhandeling van een VERS bij Mollie opgevraagde betaling voor een
 * order die in onze database nog niet op een eindstatus staat (dus nog
 * 'pending') — toegevoegd 19-9-2026 (later dezelfde dag als "Order handmatig
 * bevestigen"), voor de nieuwe knoppen "Check bij Mollie" en "Toch mails
 * versturen" in het beheertool (zie app/api/admin/check-order-payment/
 * route.ts en app/api/admin/force-confirm-order/route.ts).
 *
 * BEWUST NIET hergebruikt vanuit app/api/mollie-webhook/route.ts, en ook niet
 * andersom: de webhook is de bestaande, al lang in productie werkende en
 * geteste weg waarmee Mollie ZELF een betaling meldt — dat bestand is hier
 * expres niet aangeraakt/omgebouwd, om geen risico te lopen op die kritieke,
 * werkende route. Deze module bevat daarom noodzakelijkerwijs vergelijkbare
 * logica (status 'paid' -> markeren + mailen, 'failed'/'expired'/'canceled'
 * -> markeren, iets anders -> niets doen) maar dan voor het GEVAL dat een
 * BEHEERDER handmatig laat controleren, niet Mollie zelf via de webhook.
 */

export interface MolliePaymentForSync {
  id: string;
  status: string;
  method?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  details?: unknown;
}

export type PaymentSyncOutcome =
  | {
      kind: "paid";
      internalEmailSent: boolean;
      customerEmailSent: boolean;
      emailError: string | null;
    }
  | { kind: "failed-or-canceled"; status: "failed" | "expired" | "canceled" }
  | { kind: "still-open"; status: string };

/**
 * Werkt de order bij op basis van een VERS opgevraagde Mollie-betaling, en
 * verstuurt de bevestigingsmails als die betaling nu 'paid' blijkt.
 *
 * Roept de aanroeper NOOIT aan met een order die al op payment_status =
 * 'paid' staat — dat controleert elke aanroeper (de twee routes hierboven)
 * zelf al vóóraf, want dat vraagt om een ander soort afhandeling
 * (bijvoorbeeld: gewoon "niets te doen" teruggeven in plaats van hier
 * nogmaals een mail te proberen versturen).
 */
export async function applyMolliePaymentStatusToOrder(
  order: OrderRow,
  payment: MolliePaymentForSync
): Promise<PaymentSyncOutcome> {
  const paymentMethodName = payment.method
    ? getPaymentMethodLabel(payment.method)
    : null;
  const paymentDetails = payment.details as
    | Record<string, string | undefined>
    | undefined;
  const paymentBankName = getBankName(paymentDetails?.consumerBic);

  if (payment.status === "paid") {
    await markOrderAsPaid(
      order.id,
      payment.id,
      paymentMethodName,
      paymentBankName,
      payment.paidAt ? new Date(payment.paidAt) : null
    );

    let internalEmailSent = false;
    let customerEmailSent = false;
    let emailError: string | null = null;
    try {
      const result = await buildAndSendOrderEmailsForOrder(
        order,
        paymentMethodName,
        payment.paidAt ?? null
      );
      internalEmailSent = result.internalEmailSent;
      customerEmailSent = result.customerEmailSent;
    } catch (err) {
      emailError =
        err instanceof OrderEmailBuildError
          ? `${err.reason}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      console.error(
        `applyMolliePaymentStatusToOrder: order #${order.id} is betaald, maar de mails konden niet (volledig) verstuurd worden: ${emailError}`
      );
    }

    return { kind: "paid", internalEmailSent, customerEmailSent, emailError };
  }

  if (
    payment.status === "failed" ||
    payment.status === "expired" ||
    payment.status === "canceled"
  ) {
    const paymentFailureReason = getFailureReasonLabel(
      paymentDetails?.failureReason
    );
    await updateOrderPaymentStatus(
      order.id,
      payment.status,
      payment.id,
      paymentMethodName,
      paymentBankName,
      paymentFailureReason
    );
    return { kind: "failed-or-canceled", status: payment.status };
  }

  // Overige, niet-eindstatussen (bv. "open", "pending", "authorized") — niets
  // aan de database te wijzigen, gewoon de huidige status teruggeven zodat
  // het beheertool 'm kan tonen.
  return { kind: "still-open", status: payment.status };
}
