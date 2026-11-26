import { productColors, productColorsOren } from "@/config/product-options";

/**
 * Kleurnaam + RAL-code voor de e-mails (toegevoegd 26-11-2026, op verzoek
 * van Christiaan): in de interne ordermail die per vorm in het Duits kan
 * worden gezet, stonden de kleuren nog in het Nederlands en zonder RAL-code.
 * De kleur wordt herkend aan het id (niet aan de naam, want er zijn kleuren
 * met dezelfde naam maar een andere RAL-code). Namen en RAL-codes komen uit
 * config/product-options.ts; alleen de Duitse vertaling staat hier.
 */
const GERMAN_NAMES: Record<string, string> = {
  black: "Schwarz",
  white: "Weiß",
  navy: "Dunkelblau",
  cream: "Creme",
  green: "Grün",
  red: "Rot",
  "oren-zwart": "Schwarz",
  "oren-wit": "Weiß",
  "oren-donkerblauw": "Dunkelblau",
  "oren-creme": "Creme",
  "oren-groen": "Grün",
  "oren-rood": "Rot",
};

/** Bv. "Zwart (RAL 9005)" of, in het Duits, "Schwarz (RAL 9005)". */
export function colorLabel(
  colorId: string | null | undefined,
  language: "nl" | "de" = "nl",
  fallbackName?: string | null
): string | undefined {
  if (!colorId) return fallbackName ?? undefined;
  const color =
    productColors.find((c) => c.id === colorId) ??
    productColorsOren.find((c) => c.id === colorId);
  if (!color) return fallbackName ?? colorId;
  const name = language === "de" ? GERMAN_NAMES[colorId] ?? color.name : color.name;
  return color.ralCode ? `${name} (${color.ralCode})` : name;
}
