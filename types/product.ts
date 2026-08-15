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
