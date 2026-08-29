import { NextResponse } from "next/server";
import { createMollie, getPaymentMethodLabel } from "@/lib/mollie/client";
import { formatDutchDateTime } from "@/lib/formatDate";
import {
  getOrderById,
  markOrderAsPaid,
  updateOrderPaymentStatus,
} from "@/lib/mysql/client";
import { sendOrderEmails } from "@/lib/email/sendOrderEmails";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import { getNotificationEmail } from "@/lib/email/settings";
import { productShapes, productColors } from "@/config/product-options";
import { buildOrderLabel } from "@/lib/configuration/orderLabel";

/**
 * Ontvangt Mollie's betaalbevestigingen ("webhook"), toegevoegd 29-8-2026.
 * Mollie stuurt hier NOOIT de betaalstatus zelf naartoe — alleen een id
 * (als een gewoon formulierveld, geen JSON). De enige betrouwbare manier om
 * de status te weten te komen is 'm met dat id bij Mollie zelf opvragen,
 * dat gebeurt hieronder. Zo kan een vervalst berichtje aan dit adres nooit
 * een bestelling als betaald laten doorgaan.
 *
 * Mollie roept dit adres soms meerdere keren aan voor dezelfde betaling
 * (bijvoorbeeld bij een trage/mislukte eerdere poging) — deze route houdt
 * daar rekening mee (zie de "already"-check hieronder) en negeert een
 * herhaalde melding voor een bestelling die al als betaald geregistreerd
 * staat.
 *
 * Mollie verwacht binnen 15 seconden een 200-antwoord. Lukt de verwerking
 * niet door een onverwachte (technische) fout, dan geeft deze route bewust
 * GEEN 200 terug — Mollie probeert het dan vanzelf later opnieuw (tot 10
 * pogingen, verspreid over 26 uur). Bij een verwacht/afgehandeld geval
 * (bv. een niet-bestaande bestelling) wordt wél 200 teruggegeven, want een
 * volgende poging zou daar toch niets aan veranderen.
 */
export async function POST(request: Request) {
  let paymentId: string | null = null;
  try {
    const formData = await request.formData();
    const idValue = formData.get("id");
    paymentId = typeof idValue === "string" ? idValue : null;
  } catch (err) {
    console.error(
      "Mollie-webhook: kon het verzoek niet lezen:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  if (!paymentId) {
    console.error("Mollie-webhook: geen 'id' meegekregen.");
    return NextResponse.json({ error: "Geen id meegekregen." }, { status: 400 });
  }

  let payment;
  try {
    const mollie = createMollie();
    payment = await mollie.payments.get(paymentId);
  } catch (err) {
    console.error(
      `Mollie-webhook: kon betaling ${paymentId} niet bij Mollie opvragen:`,
      err instanceof Error ? err.message : err
    );
    // Onbekend of dit een tijdelijk (netwerk-)probleem is — geen 200, zodat
    // Mollie het later opnieuw probeert.
    return NextResponse.json({ error: "Kon betaling niet opvragen." }, { status: 500 });
  }

  const orderIdRaw = payment.metadata && (payment.metadata as { orderId?: string }).orderId;
  const orderId = orderIdRaw ? Number(orderIdRaw) : NaN;
  if (!orderIdRaw || Number.isNaN(orderId)) {
    console.error(
      `Mollie-webhook: betaling ${paymentId} heeft geen (geldig) orderId in de metadata — kan niet gekoppeld worden aan een bestelling.`
    );
    return NextResponse.json({ received: true });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    console.error(
      `Mollie-webhook: bestelling #${orderId} (bij betaling ${paymentId}) bestaat niet (meer) in de database.`
    );
    return NextResponse.json({ received: true });
  }

  // Idempotentie: Mollie kan dit adres meerdere keren aanroepen voor
  // dezelfde betaling — een bestelling die al als betaald geregistreerd
  // staat, mag nooit een 2e keer de mails laten versturen.
  if (order.payment_status === "paid") {
    return NextResponse.json({ received: true, already: "paid" });
  }

  if (payment.status === "paid") {
    try {
      await markOrderAsPaid(orderId, paymentId);
    } catch (err) {
      console.error(
        `Mollie-webhook: kon bestelling #${orderId} niet op 'paid' zetten:`,
        err instanceof Error ? err.message : err
      );
      return NextResponse.json({ error: "Kon bestelling niet bijwerken." }, { status: 500 });
    }

    // De prijs zelf komt NIET opnieuw uit de (live) prijstool — die kan
    // intussen gewijzigd zijn — maar uit de database, waar bij het
    // aanmaken van de betaling (app/api/create-payment/route.ts) al de
    // prijs staat die de klant daadwerkelijk betaald heeft. Alleen de
    // afmetingen/kleur (nodig om de voorbeeldafbeelding opnieuw te
    // tekenen) worden hier opnieuw opgezocht, via dezelfde vorm/maat/
    // kleur-ID's als bij het bestellen.
    try {
      const shape = productShapes.find((s) => s.id === order.shape_id);
      const color = productColors.find((c) => c.id === order.color_id);
      const pricingData = await getLivePricingData();
      const size = pricingData.productSizes.find((s) => s.id === order.size_id);

      if (!shape || !color || !size) {
        console.error(
          `Mollie-webhook: bestelling #${orderId} is betaald, maar vorm/kleur/maat (${order.shape_id}/${order.color_id}/${order.size_id}) kon niet meer teruggevonden worden — mails NIET verstuurd. Handmatig navragen bij de klant is nodig.`
        );
        return NextResponse.json({ received: true, warning: "product-lookup-failed" });
      }

      const fallbackAdminEmail = process.env.ADMIN_EMAIL;
      if (!fallbackAdminEmail) {
        console.error(
          `Mollie-webhook: bestelling #${orderId} is betaald, maar ADMIN_EMAIL ontbreekt — mails NIET verstuurd.`
        );
        return NextResponse.json({ received: true, warning: "admin-email-missing" });
      }
      const adminEmail = await getNotificationEmail("order_notification", fallbackAdminEmail);

      const orderLabel = buildOrderLabel(shape, order.number_position);

      // Op verzoek van Christiaan (29-8-2026, na de eerste test) laten de
      // mails voortaan ook zien DAT en WAARMEE er betaald is — Mollie geeft
      // dat door via payment.method (bv. "ideal") en payment.paidAt (het
      // exacte moment). paidAt kan in theorie ontbreken (bv. bij een heel
      // ongebruikelijke edge-case) — dan valt dit terug op "nu" in plaats
      // van de mail te laten mislukken.
      const paymentMethodName = getPaymentMethodLabel(payment.method);
      const paidAtFormatted = formatDutchDateTime(payment.paidAt ?? new Date());

      const result = await sendOrderEmails({
        shape: { name: shape.name, extraLines: shape.extraLines },
        finish: order.finish,
        colorName: color.name,
        colorHex: color.hex,
        isOval: shape.id === "ovaal",
        widthMm: size.width,
        heightMm: size.height,
        sizeName: order.size_name,
        numberFontId: order.font_id,
        numberFontName: order.font_name,
        line1FontId: order.line1_font_id,
        line1FontName: order.line1_font_name,
        line2FontId: order.line2_font_id,
        line2FontName: order.line2_font_name,
        customText: order.custom_text,
        extraLine1: order.extra_line_1,
        extraLine2: order.extra_line_2,
        numberPosition: order.number_position,
        hasFrame: Boolean(order.has_frame),
        orderLabel,
        priceTotalCents: order.price_total_cents,
        priceColorSurchargeCents: order.price_color_surcharge_cents,
        priceExtraCharsCents: order.price_extra_chars_cents,
        priceExtraCharsCount: order.price_extra_chars_count,
        priceFrameSurchargeCents: order.price_frame_surcharge_cents,
        contact: {
          name: order.contact_name,
          address: order.contact_address,
          postalCode: order.contact_postal_code,
          city: order.contact_city,
          email: order.contact_email,
          phone: order.contact_phone,
          quantity: order.quantity,
        },
        adminEmail,
        paymentMethodName,
        paidAtFormatted,
      });

      if (!result.internalEmailSent || !result.customerEmailSent) {
        console.error(
          `Mollie-webhook: bestelling #${orderId} is betaald, maar niet alle mails zijn gelukt (intern: ${result.internalEmailSent}, klant: ${result.customerEmailSent}) — zie de foutmeldingen hierboven.`
        );
      }
    } catch (err) {
      console.error(
        `Mollie-webhook: bestelling #${orderId} is betaald, maar het versturen van de mails is onverwacht mislukt:`,
        err instanceof Error ? err.message : err
      );
      // De betaling staat al goed geregistreerd (payment_status = 'paid'),
      // dat is het belangrijkste — een 200 hier voorkomt dat Mollie het
      // blijft proberen voor iets wat toch al gelukt is (de betaling zelf).
      return NextResponse.json({ received: true, warning: "emails-failed" });
    }

    return NextResponse.json({ received: true });
  }

  if (
    payment.status === "failed" ||
    payment.status === "expired" ||
    payment.status === "canceled"
  ) {
    try {
      await updateOrderPaymentStatus(orderId, payment.status, paymentId);
    } catch (err) {
      console.error(
        `Mollie-webhook: kon bestelling #${orderId} niet op '${payment.status}' zetten:`,
        err instanceof Error ? err.message : err
      );
      return NextResponse.json({ error: "Kon bestelling niet bijwerken." }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }

  // Overige, niet-eindstatussen (bv. "open", "pending", "authorized"):
  // niets te doen, Mollie roept dit adres later opnieuw aan zodra er een
  // definitieve status is.
  return NextResponse.json({ received: true });
}
