import { NextResponse } from "next/server";
import { createMollie, getSiteUrl } from "@/lib/mollie/client";
import { getOrderById, claimExpiredNotification } from "@/lib/mysql/client";
import { createResendClient } from "@/lib/email/resend";
import { renderPaymentExpiredEmail } from "@/lib/email/templates/payment-expired-notification";
import { formatEuroFromCents } from "@/lib/format/euro";

/**
 * "Aan de klant melden" (verlopen óf mislukte betaling), toegevoegd
 * 28-9-2026 op verzoek van Christiaan, uitgebreid 30-9-2026 met "mislukt" —
 * wordt aangeroepen door het BEHEERTOOL (een apart project), nooit
 * rechtstreeks door een browser. Zelfde opzet/beveiliging als
 * app/api/admin/resend-order-emails/route.ts: het beheertool stuurt alleen
 * het order-id en de ingetypte naam van de beheerder door, en deze route
 * controleert ALLES zelf opnieuw (nooit vertrouwen op wat het beheertool
 * toevallig al op het scherm had staan) vóórdat er iets verstuurd wordt:
 * 1. de betaling staat bij Mollie zelf ECHT (nog steeds) op "expired" of
 *    "failed" — vers opgevraagd, niet de eigen (mogelijk verouderde)
 *    database-kolom;
 * 2. deze order is nog niet eerder gemeld (claimExpiredNotification,
 *    lib/mysql/client.ts) — voorkomt dubbel mailen bij een dubbelklik, een
 *    tweede beheerder, of een herhaald verzoek. Dezelfde "melding"-claim
 *    geldt voor beide gevallen (er staat geen apart veld per reden).
 */

interface RequestBody {
  orderId?: unknown;
  reportedBy?: unknown;
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
  const reportedBy =
    typeof body.reportedBy === "string" ? body.reportedBy.trim() : "";

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", message: "Ongeldig of ontbrekend orderId." },
      { status: 400 }
    );
  }
  if (!reportedBy) {
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

  // Altijd vers bij Mollie zelf opvragen — zie de toelichting bovenaan dit
  // bestand.
  let paymentStatus: string;
  try {
    const mollie = createMollie();
    const payment = await mollie.payments.get(order.mollie_payment_id);
    paymentStatus = payment.status;
  } catch (err) {
    console.error(
      `report-expired-order: kon betaling ${order.mollie_payment_id} (order #${orderId}) niet bij Mollie opvragen:`,
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

  // Uitgebreid 30-9-2026 (op verzoek van Christiaan): naast "verlopen" ook
  // toegestaan bij "mislukt" (bv. een door de bank/creditcard geweigerde
  // betaling) — beide zijn voor de klant hetzelfde soort situatie ("nog niet
  // betaald, wel nog een kans om het alsnog te doen"), zie de `reason` in
  // renderPaymentExpiredEmail voor het enige inhoudelijke verschil.
  if (paymentStatus !== "expired" && paymentStatus !== "failed") {
    return NextResponse.json(
      {
        ok: false,
        reason: "not-expired",
        message: `Deze betaling staat bij Mollie niet (meer) op 'verlopen' of 'mislukt' (huidige status: ${paymentStatus}).`,
      },
      { status: 409 }
    );
  }

  if (order.price_total_cents === null) {
    return NextResponse.json(
      {
        ok: false,
        reason: "no-price",
        message: `Bestelling #${orderId} heeft geen bekende prijs, kan geen mail met "alsnog betalen"-link versturen.`,
      },
      { status: 409 }
    );
  }

  // "Claimen" vóórdat er ook maar geprobeerd wordt een mail te versturen —
  // zie confirmOrderManually/claimExpiredNotification (lib/mysql/client.ts)
  // voor waarom dit een dubbele mail bij een race condition voorkomt.
  const claimed = await claimExpiredNotification(orderId, reportedBy);
  if (!claimed) {
    return NextResponse.json(
      {
        ok: false,
        reason: "already-notified",
        message: "Deze klant is al eerder over deze betaling gemaild.",
      },
      { status: 409 }
    );
  }

  // TypeScript onthoudt de controle hierboven niet als een vernauwing van
  // paymentStatus (die blijft gewoon `string`) — vandaar deze expliciete
  // omzetting naar de twee-waardige `reason` die renderPaymentExpiredEmail
  // verwacht.
  const reason: "expired" | "failed" = paymentStatus === "expired" ? "expired" : "failed";

  const siteUrl = getSiteUrl();
  let emailSent = false;
  let errorMessage: string | null = null;

  try {
    const html = renderPaymentExpiredEmail({
      orderId: order.id,
      reason,
      contactName: order.contact_name,
      contactAddress: order.contact_address,
      contactPostalCode: order.contact_postal_code,
      contactCity: order.contact_city,
      shapeName: order.shape_name,
      finish: order.finish,
      colorName: order.color_name ?? undefined,
      printColorName: order.print_color_name ?? undefined,
      earColorName: order.ear_color_name ?? undefined,
      plateColorName: order.plate_color_name ?? undefined,
      sizeName: order.size_name,
      customText: order.custom_text,
      extraLine1: order.extra_line_1 ?? undefined,
      extraLine2: order.extra_line_2 ?? undefined,
      priceLabel: formatEuroFromCents(order.price_total_cents),
      retryPaymentUrl: `${siteUrl}/api/orders/${order.id}/retry-payment`,
      webshopUrl: siteUrl,
    });

    const resend = createResendClient();
    const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `Emaillehuisnummerbord <${fromAddress}>`,
      to: order.contact_email,
      subject:
        reason === "expired"
          ? `Je betaling voor bestelling #${order.id} is verlopen — Huisnummerbord`
          : `Je betaling voor bestelling #${order.id} is niet gelukt — Huisnummerbord`,
      html,
    });

    if (error) {
      errorMessage = error.message || "Onbekende fout bij het versturen via Resend.";
      console.error(`report-expired-order: order #${orderId} — Resend-fout:`, error);
    } else {
      emailSent = true;
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`report-expired-order: order #${orderId} — ${errorMessage}`);
  }

  // De melding zelf staat al vast (geclaimd, hierboven) — dat wordt nooit
  // teruggedraaid, ook niet bij een mislukte mail (zelfde uitgangspunt als
  // resend-order-emails/route.ts). Een mislukte mail wordt wél duidelijk
  // als zodanig teruggemeld, nooit als volledig succes.
  if (!emailSent) {
    return NextResponse.json(
      {
        ok: false,
        reason: "mail-failed",
        message: errorMessage ?? "De mail kon niet verstuurd worden.",
      },
      { status: 207 }
    );
  }

  return NextResponse.json({ ok: true, emailSent });
}
