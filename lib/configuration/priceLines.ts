import { productColors } from "@/config/product-options";
import { getEarsColorOptions } from "@/lib/configuration/shape-helpers";
import { formatPriceCents, type PriceBreakdown } from "@/lib/configuration/pricing";

/**
 * Prijsopbouw per stuk, incl. btw (toegevoegd 25-11-2026, verbouwing
 * prijsstructuur): de losse onderdelen waaruit de productprijs bestaat, in
 * dezelfde volgorde en met dezelfde bedragen als calculatePrice() optelt.
 * Gebruikt onder de preview en in de controlestap, zodat die altijd gelijk
 * zijn. Bevat alleen bedragen die voor de klant bedoeld zijn — nooit
 * inkoopprijs, marge of kleurgroep.
 */
export interface PriceLine {
  label: string;
  cents: number;
}

function colorLabel(colorId: string): string {
  const color =
    productColors.find((c) => c.id === colorId) ??
    getEarsColorOptions().find((c) => c.id === colorId);
  if (!color) return colorId;
  return color.ralCode ? `${color.name} – ${color.ralCode}` : color.name;
}

export function buildPriceLines(price: PriceBreakdown, earsShape: boolean): PriceLine[] {
  const lines: PriceLine[] = [];
  lines.push({
    label: earsShape ? "Bord" : price.finishForPrice === "vlak" ? "Bord facet" : "Bord gewelfd",
    cents: price.basePriceCents,
  });
  for (const line of price.colorLines) {
    lines.push({
      label: `Kleur ${line.role}: ${colorLabel(line.colorId)}`,
      cents: line.cents,
    });
  }
  if (price.extraCharsCount > 0) {
    lines.push({
      label: `Extra karakters: ${price.extraCharsCount} × ${formatPriceCents(price.extraCharUnitCents)}`,
      cents: price.extraCharsCents,
    });
  }
  if (price.frameSurchargeCents > 0) {
    lines.push({ label: "Kader", cents: price.frameSurchargeCents });
  }
  return lines;
}

/** Productprijs per stuk (zonder verzending) = exacte som van de regels. */
export function productPriceCents(price: PriceBreakdown): number {
  return price.totalCents - price.shippingCostCents;
}
