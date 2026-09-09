export type PlateFinish = "vlak" | "gewelfd";

/**
 * Hoe de kleurkeuze van een vorm werkt.
 *
 * "single"          — het bestaande gedrag: één kleurkeuze
 *                      (ConfiguratorSelection.colorId), uit `productColors`.
 *                      Gebruikt door alle 4 oorspronkelijke vormen.
 * "ears-and-plate"   — toegevoegd 9-9-2026 voor de 3 nieuwe jaren-30-vormen
 *                      met bevestigingsogen: TWEE losse, allebei verplichte
 *                      kleurkeuzes (ConfiguratorSelection.earColorId +
 *                      plateColorId), uit de aparte lijst `productColorsOren`
 *                      (nooit uit `productColors`). Zie
 *                      lib/configuration/shape-helpers.ts voor de helpers die
 *                      hierop filteren, zodat dit onderscheid niet overal
 *                      opnieuw uitgeschreven hoeft te worden.
 */
export type ColorMode = "single" | "ears-and-plate";

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

  // ---------------------------------------------------------------------
  // Capability-vlaggen — toegevoegd 9-9-2026 bij de uitbreiding naar 7
  // vormen. De 4 oorspronkelijke vormen krijgen hieronder overal expliciet
  // de waarde die hun bestaande gedrag beschrijft (niets impliciet), de 3
  // nieuwe "oren"-vormen krijgen de afwijkende waarden. Zie
  // config/product-options.ts voor de daadwerkelijke invulling per vorm en
  // lib/configuration/shape-helpers.ts voor de bijbehorende helperfuncties.
  // ---------------------------------------------------------------------

  /** false = geen maatkeuze, er is precies 1 vaste maat (zie productSizes). */
  hasSizeChoice: boolean;
  /** false = geen vlak/gewelfd-keuze (gebruikt dan ook `availableFinishes` niet). */
  hasFinishChoice: boolean;
  /** false = geen lettertypekeuze, vaste typografie. */
  hasFontChoice: boolean;
  /** false = geen kaderoptie. */
  hasFrameChoice: boolean;
  /** Zie ColorMode hierboven. */
  colorMode: ColorMode;
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

export interface ProductFont {
  id: string;
  name: string;
  slug: string;
  cssFamily: string;
  active: boolean;
  createdAt: string;
}
