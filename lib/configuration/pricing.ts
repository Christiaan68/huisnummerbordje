import type { ConfiguratorSelection } from "@/types/configuration";
import type { PricingData } from "@/lib/configuration/livePricing";

/**
 * Berekent de actuele prijs voor de huidige configuratorkeuzes.
 *
 * De prijsgegevens (`pricingData`) komen NIET meer statisch uit dit bestand
 * of uit config/product-options.ts, maar worden meegegeven door de
 * aanroeper — normaal gesproken de live opgehaalde prijzen uit de
 * prijsbeheeromgeving (zie lib/configuration/livePricing.ts), met een
 * automatische terugval op de vaste reservekopie als het live ophalen niet
 * lukt. Dat gebeurt hier niet meer — deze functie is een pure rekenfunctie.
 *
 * Nog niet meegenomen in deze berekening:
 * - de meerprijs voor extra karakters geldt alleen voor het huisnummer
 *   zelf, niet voor de optionele extra tekstregels (zo besloten door
 *   Christiaan op 2026-08-15).
 */
export interface PriceBreakdown {
  basePriceCents: number;
  colorSurchargeCents: number;
  extraCharsCount: number;
  extraCharsCents: number;
  frameSurchargeCents: number;
  totalCents: number;
}

export function calculatePrice(
  selection: ConfiguratorSelection,
  pricingData: PricingData
): PriceBreakdown | null {
  const { productSizes, globalPricingOptions } = pricingData;

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

  const frameSurchargeCents = selection.hasFrame
    ? globalPricingOptions.frameSurchargeCents
    : 0;

  const totalCents =
    basePriceCents + colorSurchargeCents + extraCharsCents + frameSurchargeCents;

  return {
    basePriceCents,
    colorSurchargeCents,
    extraCharsCount,
    extraCharsCents,
    frameSurchargeCents,
    totalCents,
  };
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
