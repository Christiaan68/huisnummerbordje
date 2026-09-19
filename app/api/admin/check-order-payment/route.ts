import { NextResponse } from "next/server";
import { createMollie } from "@/lib/mollie/client";
import { getOrderById } from "@/lib/mysql/client";
import { applyMolliePaymentStatusToOrder } from "@/lib/mollie/applyMolliePaymentStatus";

/**
 * "Check bij Mollie" (toegevoegd 19-9-2026, later dezelfde dag als "Order
 * handmatig bevestigen") — wordt aangeroepen door het BEHEERTOOL voor een
 * order die daar nog als 'Open' of 'Verlopen' getoond wordt (payment_status
 * 'pending'/'expired'), op verzoek van Christiaan: "Eerst knop om bij Mollie
 * te checken en als dan nog steeds niet betaald is, dan de knop dat je de
 * emails wilt versturen. Als Mollie aan kan geven of de betaling mislukt is
 * of geannuleerd, dan moet dat in het veld komen te staan en hoeft er geen
 * knop bij om de mails te kunnen versturen."
 *
 * Vraagt de actuele status VERS bij Mollie zelf op (nooit vertrouwen op wat
 * de database toevallig al zegt) en werkt de database bij via de gedeelde
 * lib/mollie/applyMolliePaymentStatus.ts — blijkt de betaling alsnog
 * 'paid', dan gaan de gewone bevestigingsmails alsnog uit (net zoals de
 * Mollie-webhook dat normaal zelf zou doen). Verandert er niets (betaling
 * staat nog steeds open), dan wordt hier ook niets in de database
 * aangepast — dit is puur een controle, geen bevestiging. Zie
 * app/api/admin/force-confirm-order/route.ts voor de knop die daarna, indien
 * gewenst, een bewuste handmatige overschrijving uitvoert.
 *
 * BEVEILIGING: zelfde ADMIN_TOOL_API_KEY als resend-order-emails hiernaast —
 * nooit naar de browser van de beheerder, alleen server-naar-server.
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

  if (order.payment_status === "paid") {
    return NextResponse.json({
      ok: true,
      status: "paid",
      alreadyPaid: true,
      message: "Deze bestelling staat al op 'betaald'.",
    });
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

  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(order.mollie_payment_id);
  } catch (err) {
    console.error(
      `check-order-payment: kon betaling ${order.mollie_payment_id} (order #${orderId}) niet bij Mollie opvragen:`,
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

  const outcome = await applyMolliePaymentStatusToOrder(order, payment);

  if (outcome.kind === "paid") {
    if (!outcome.internalEmailSent || !outcome.customerEmailSent) {
      return NextResponse.json(
        {
          ok: false,
          reason: "emails-partially-failed",
          status: "paid",
          message:
            outcome.emailError ??
            `Niet alle mails zijn gelukt (intern: ${outcome.internalEmailSent}, klant: ${outcome.customerEmailSent}).`,
          internalEmailSent: outcome.internalEmailSent,
          customerEmailSent: outcome.customerEmailSent,
        },
        { status: 207 }
      );
    }
    return NextResponse.json({
      ok: true,
      status: "paid",
      message: "Mollie meldt nu dat de betaling gelukt is — de bevestigingsmails zijn verstuurd.",
      internalEmailSent: true,
      customerEmailSent: true,
    });
  }

  if (outcome.kind === "failed-or-canceled") {
    const labels: Record<string, string> = {
      failed: "mislukt",
      expired: "verlopen",
      canceled: "geannuleerd",
    };
    return NextResponse.json({
      ok: true,
      status: outcome.status,
      message: `Mollie geeft aan dat deze betaling ${labels[outcome.status] ?? outcome.status} is.`,
    });
  }

  return NextResponse.json({
    ok: true,
    status: outcome.status,
    stillOpen: true,
    message: `Mollie meldt nog steeds geen definitieve status (huidige status: ${outcome.status}).`,
  });
}
