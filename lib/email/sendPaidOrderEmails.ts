import { getLivePricingData } from "@/lib/configuration/livePricing";
import { getNotificationEmail } from "@/lib/email/settings";
import { getShapeLanguage } from "@/lib/email/shapeLanguage";
import { productShapes, productColors } from "@/config/product-options";
import { buildOrderLabel } from "@/lib/configuration/orderLabel";
import {
  isEarsShape,
  getEarsColorOptions,
} from "@/lib/configuration/shape-helpers";
import { getEarsStyleForShapeId } from "@/lib/configuration/plate-visual";
import { formatDutchDateTime } from "@/lib/formatDate";
import {
  sendOrderEmails,
  type SendOrderEmailsResult,
} from "@/lib/email/sendOrderEmails";
import type { OrderRow } from "@/lib/mysql/client";

/**
 * Gedeelde opbouw + verzending van de twee bevestigingsmails (klant +
 * webshop) voor één BETAALDE order — toegevoegd 19-9-2026 (samen met "Order
 * handmatig bevestigen") door de opbouwlogica die tot dan toe alleen inline
 * in app/api/mollie-webhook/route.ts stond, hierheen te verplaatsen.
 *
 * Reden: zowel de Mollie-webhook (de normale weg) als
 * app/api/admin/resend-order-emails/route.ts (de handmatige weg, aangeroepen
 * vanuit het beheertool) moeten EXACT dezelfde mails met dezelfde sjablonen
 * kunnen versturen — op uitdrukkelijk verzoek van Christiaan geen tweede,
 * losstaande implementatie hiervan. Deze functie is dus de ENIGE plek waar
 * de order-rij wordt omgezet naar de invoer die sendOrderEmails() verwacht;
 * verandert de opbouw ooit (nieuwe vorm, ander veld), dan hoeft dat maar op
 * één plek te gebeuren.
 *
 * Gooit een OrderEmailBuildError als de order-gegevens niet meer compleet
 * genoeg zijn om een mail van te bouwen (bijvoorbeeld een vorm/kleur die
 * inmiddels uit config/product-options.ts is verwijderd) — de aanroeper
 * beslist zelf hoe dat getoond/gelogd wordt; er wordt in dat geval nooit een
 * mail met verzonnen/lege gegevens verstuurd.
 */
export class OrderEmailBuildError extends Error {
  constructor(
    message: string,
    public readonly reason: "product-lookup-failed" | "admin-email-missing"
  ) {
    super(message);
    this.name = "OrderEmailBuildError";
  }
}

export async function buildAndSendOrderEmailsForOrder(
  order: OrderRow,
  paymentMethodName: string | null,
  paidAt: Date | string | null
): Promise<SendOrderEmailsResult> {
  const shape = productShapes.find((s) => s.id === order.shape_id);
  const pricingData = await getLivePricingData();
  const size = pricingData.productSizes.find((s) => s.id === order.size_id);

  if (!shape || !size) {
    throw new OrderEmailBuildError(
      `Vorm/maat (${order.shape_id}/${order.size_id}) van order #${order.id} kon niet meer teruggevonden worden.`,
      "product-lookup-failed"
    );
  }

  // Zelfde 2 takken (colorMode "single" vs. "ears-and-plate") als
  // app/api/mollie-webhook/route.ts vóór deze verplaatsing — zie daar (of
  // types/configuration.ts) voor de volledige achtergrond.
  const earsShape = isEarsShape(shape);
  let color: (typeof productColors)[number] | undefined;
  let printColor: (typeof productColors)[number] | undefined;
  let earColor: ReturnType<typeof getEarsColorOptions>[number] | undefined;
  let plateColor: ReturnType<typeof getEarsColorOptions>[number] | undefined;

  if (earsShape) {
    const earsColors = getEarsColorOptions();
    earColor = earsColors.find((c) => c.id === order.ear_color_id);
    plateColor = earsColors.find((c) => c.id === order.plate_color_id);
    if (!earColor || !plateColor) {
      throw new OrderEmailBuildError(
        `Oren-/vlakkleur (${order.ear_color_id}/${order.plate_color_id}) van order #${order.id} kon niet meer teruggevonden worden.`,
        "product-lookup-failed"
      );
    }
  } else {
    color = productColors.find((c) => c.id === order.color_id);
    printColor = productColors.find((c) => c.id === order.print_color_id);
    if (!color || !printColor) {
      throw new OrderEmailBuildError(
        `Ondergrond-/opdrukkleur (${order.color_id}/${order.print_color_id}) van order #${order.id} kon niet meer teruggevonden worden.`,
        "product-lookup-failed"
      );
    }
  }

  const fallbackAdminEmail = process.env.ADMIN_EMAIL;
  if (!fallbackAdminEmail) {
    throw new OrderEmailBuildError(
      "ADMIN_EMAIL ontbreekt in de environment variables.",
      "admin-email-missing"
    );
  }
  const adminEmail = await getNotificationEmail(
    "order_notification",
    fallbackAdminEmail
  );
  const emailLanguage = await getShapeLanguage(shape.id);
  const orderLabel = buildOrderLabel(shape, order.number_position, emailLanguage);
  const paidAtFormatted = formatDutchDateTime(paidAt ?? new Date());

  return sendOrderEmails({
    orderId: order.id,
    shape: { id: shape.id, name: shape.name, extraLines: shape.extraLines },
    finish: order.finish,
    colorName: earsShape ? undefined : color!.name,
    printColorName: earsShape ? undefined : printColor!.name,
    earColorName: earsShape ? earColor!.name : undefined,
    plateColorName: earsShape ? plateColor!.name : undefined,
    colorHex: earsShape ? plateColor!.hex : color!.hex,
    printColorHex: earsShape ? undefined : printColor!.hex,
    earColorHex: earsShape ? earColor!.hex : undefined,
    plateColorHex: earsShape ? plateColor!.hex : undefined,
    shapeKind: earsShape ? "ears" : shape.id === "ovaal" ? "oval" : "rect",
    earsStyle: earsShape
      ? getEarsStyleForShapeId(shape.id) ?? undefined
      : undefined,
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
    shippingCarrierName: order.shipping_carrier_name,
    shippingTierName: order.shipping_tier_name,
    shippingCostCents: order.shipping_cost_cents,
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
    emailLanguage,
    paymentMethodName: paymentMethodName ?? "onbekend",
    paidAtFormatted,
  });
}
