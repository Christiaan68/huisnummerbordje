import { productSizes, globalPricingOptions } from "@/config/product-options";
import type { ConfiguratorSelection } from "@/types/configuration";

/**
 * Berekent de actuele prijs voor de huidige configuratorkeuzes.
 *
 * Belangrijk: de bedragen komen uit een HANDMATIGE MOMENTOPNAME van de
 * prijsbeheeromgeving (zie de uitleg bovenin config/product-options.ts) —
 * er is nog geen automatische synchronisatie tussen de prijsbeheeromgeving
 * en deze webshop.
 *
 * Nog niet meegenomen in deze berekening:
 * - de meerprijs voor "speciaal teken" (bewust nog niet gebouwd);
 * - de meerprijs voor extra karakters geldt alleen voor het huisnummer
 *   zelf, niet voor de optionele extra tekstregels (zo besloten door
 *   Christiaan op 2026-08-15).
 */
export interface PriceBreakdown {
  basePriceCents: number;
  colorSurchargeCents: number;
  extraCharsCount: number;
  extraCharsCents: number;
  totalCents: number;
}

export function calculatePrice(
  selection: ConfiguratorSelection
): PriceBreakdown | null {
  const size = productSizes.find((s) => s.id === selection.sizeId);
  if (!size || !selection.finish) return null;

  const basePriceCents =
    selection.finish === "vlak" ? size.priceFlatCents : size.priceCurvedCents;
  if (basePriceCents === null || basePriceCents === undefined) return null;

  // Nog geen kleur gekozen? Dan nog geen meerprijs tonen (die komt vanzelf
  // zodra de klant een kleur kiest).
  const isStandardColor = selection.colorId
    ? globalPricingOptions.standardColorIds.includes(selection.colorId)
    : true;
  const colorSurchargeCents = isStandardColor
    ? 0
    : globalPricingOptions.colorSurchargeCents;

  const extraCharsCount = Math.max(
    0,
    selection.customText.length - size.defaultMaxChars
  );
  const extraCharsCents = extraCharsCount * globalPricingOptions.extraCharPriceCents;

  const totalCents = basePriceCents + colorSurchargeCents + extraCharsCents;

  return {
    basePriceCents,
    colorSurchargeCents,
    extraCharsCount,
    extraCharsCents,
    totalCents,
  };
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
