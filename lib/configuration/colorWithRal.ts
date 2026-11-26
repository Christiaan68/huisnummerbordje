import type { ProductColor } from "@/types/product";

/**
 * Kleurnaam met RAL-code voor de keuzelijst in de configurator (live preview
 * en controlestap), bv. "Wit (RAL 9016)" (toegevoegd 26-11-2026, op verzoek
 * van Christiaan). Nog niets gekozen = "—".
 */
export function colorWithRal(color: Pick<ProductColor, "name" | "ralCode"> | null | undefined): string {
  if (!color) return "—";
  return color.ralCode ? `${color.name} (${color.ralCode})` : color.name;
}
