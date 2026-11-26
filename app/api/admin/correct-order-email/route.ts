import { NextResponse } from "next/server";
import { getOrderById, correctOrderEmail } from "@/lib/mysql/client";
import { buildAndSendOrderEmailsForOrder } from "@/lib/email/sendPaidOrderEmails";
import { isValidEmailFormat } from "@/lib/email/isValidEmailFormat";

/**
 * E-mailadres van een BETAALDE bestelling corrigeren en de bevestiging
 * opnieuw naar de klant sturen (toegevoegd 26-11-2026, besluit Christiaan).
 * Alleen aan te roepen door de beheertool (server-naar-server, x-api-key =
 * ADMIN_TOOL_API_KEY), net als de andere routes in app/api/admin/.
 *
 * De bevestiging wordt opgebouwd uit de OPGESLAGEN bestelling (dezelfde
 * bedragen als toen), en alleen naar de klant gestuurd — de interne melding
 * ging al eerder.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedApiKey = process.env.ADMIN_TOOL_API_KEY;
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json(
      { ok: false, message: "Ongeldige of ontbrekende API-key." },
      { status: 401 }
    );
  }

  let body: { orderId?: unknown; newEmail?: unknown; correctedBy?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Ongeldig verzoek." }, { status: 400 });
  }

  const orderId = Number(body.orderId);
  const newEmail = typeof body.newEmail === "string" ? body.newEmail.trim() : "";
  const correctedBy =
    typeof body.correctedBy === "string" && body.correctedBy.trim()
      ? body.correctedBy.trim().slice(0, 100)
      : "beheertool";

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ ok: false, message: "Ongeldig ordernummer." }, { status: 400 });
  }
  if (!newEmail || newEmail.length > 255 || !isValidEmailFormat(newEmail)) {
    return NextResponse.json(
      { ok: false, message: "Dit is geen geldig e-mailadres." },
      { status: 400 }
    );
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      { ok: false, message: `Bestelling #${orderId} bestaat niet.` },
      { status: 404 }
    );
  }
  if (order.payment_status !== "paid") {
    return NextResponse.json(
      {
        ok: false,
        message: `Bestelling #${orderId} is (nog) niet betaald; alleen bij een betaalde bestelling wordt een bevestiging verstuurd.`,
      },
      { status: 409 }
    );
  }

  const updated = await correctOrderEmail(orderId, newEmail, correctedBy);
  if (!updated) {
    return NextResponse.json(
      { ok: false, message: "Het e-mailadres kon niet worden aangepast." },
      { status: 500 }
    );
  }

  const fresh = (await getOrderById(orderId)) ?? { ...order, contact_email: newEmail };
  try {
    const result = await buildAndSendOrderEmailsForOrder(
      fresh,
      fresh.payment_method_name ?? null,
      fresh.paid_at ?? null,
      { customerOnly: true }
    );
    if (!result.customerEmailSent) {
      return NextResponse.json(
        {
          ok: false,
          message: `Het e-mailadres is aangepast naar ${newEmail}, maar het versturen van de bevestiging is mislukt. Probeer het later opnieuw.`,
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Opnieuw versturen bevestiging na e-mailcorrectie mislukt:", err);
    return NextResponse.json(
      {
        ok: false,
        message: `Het e-mailadres is aangepast naar ${newEmail}, maar het versturen van de bevestiging is mislukt.`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `E-mailadres aangepast naar ${newEmail} en de bevestiging is opnieuw verstuurd.`,
  });
}
