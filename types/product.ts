export type PlateFinish = "vlak" | "gewelfd";

export interface ProductShape {
  id: string;
  name: string;
  slug: string;
  description: string;
  extraLines: 0 | 1 | 2;
  availableFinishes: PlateFinish[];
  imageSrc: string;
  active: boolean;
  createdAt: string;
}

export interface ProductColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  productCode?: string;
  // De officiële RAL-kleurcode (bijv. "RAL 6012"), door Christiaan zelf
  // opgegeven op 19-8-2026. Wordt getoond onder de kleurnaam in de
  // configurator (zie components/configurator/ColorSelector.tsx).
  ralCode?: string;
  active: boolean;
  createdAt: string;
}

export interface ProductSize {
  id: string;
  shapeId: string;
  name: string;
  width: number;
  height: number;
  unit: "mm";
  priceFlatCents: number | null;
  priceCurvedCents: number | null;
  // Aantal tekens dat gratis is voor het huisnummer op deze maat, vóórdat
  // de meerprijs per extra teken (zie config/product-options.ts,
  // globalPricingOptions.extraCharPriceCents) gaat gelden. Komt uit de
  // prijsbeheeromgeving ("Standaard maximaal aantal karakters").
  defaultMaxChars: number;
  active: boolean;
  createdAt: string;
}

export type FontSlug = "classic" | "modern" | "industrial" | "elegant";

export interface ProductFont {
  id: string;
  name: string;
  slug: FontSlug | string;
  cssFamily: string;
  active: boolean;
  createdAt: string;
}
