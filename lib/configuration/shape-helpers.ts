import { productColorsOren } from "@/config/product-options";
import type { ProductColor, ProductShape } from "@/types/product";

/**
 * Kleine, gedeelde helpers rond de capability-vlaggen op ProductShape (zie
 * types/product.ts) — vooral bedoeld om `shape.colorMode === "ears-and-plate"`
 * niet overal opnieuw te hoeven uitschrijven/importeren.
 *
 * Toegevoegd 9-9-2026 bij de uitbreiding naar 7 vormen (3 nieuwe
 * jaren-30-vormen met bevestigingsogen, zie config/product-options.ts).
 */

/** True voor de 3 "oren"-vormen (colorMode "ears-and-plate"), false voor de 4 oorspronkelijke vormen. */
export function isEarsShape(shape: Pick<ProductShape, "colorMode"> | null | undefined): boolean {
  return shape?.colorMode === "ears-and-plate";
}

/** True als de vorm met id `shapeId` een "oren"-vorm is. Handig op plekken die alleen het id bij de hand hebben. */
export function isEarsShapeId(
  shapeId: string | null | undefined,
  shapes: Pick<ProductShape, "id" | "colorMode">[]
): boolean {
  const shape = shapes.find((s) => s.id === shapeId);
  return isEarsShape(shape);
}

/**
 * De kleurenlijst voor de "oren"-vormen — altijd `productColorsOren`, nooit
 * de gewone `productColors`. Als functie (i.p.v. de export rechtstreeks
 * hergebruiken) zodat callers niet zelf hoeven te weten uit welk bestand die
 * lijst komt, en zodat dit later evt. per-vorm gefilterd kan worden zonder
 * alle call-sites aan te passen.
 */
export function getEarsColorOptions(): ProductColor[] {
  return productColorsOren;
}
