/**
 * Producttype-definities.
 * Deze types corresponderen 1-op-1 met de Supabase-tabellen
 * product_shapes, product_colors, product_sizes en product_fonts.
 */

export type PlateFinish = "vlak" | "gewelfd";

export interface ProductShape {
  id: string;
  name: string;
  slug: string;
  /** Korte omschrijving zoals getoond in de keuzekaart. */
  description: string;
  /** Aantal extra tekstregels bovenop het huisnummer (elk max. 20 tekens). */
  extraLines: 0 | 1 | 2;
  /** Welke afwerkingen voor deze vorm besteld kunnen worden. */
  availableFinishes: PlateFinish[];
  /** Toegestane range voor de intypbare tekengrootte van het huisnummer, in mm. */
  characterSizeRange: { min: number; max: number };
  /** Toegestane range voor de intypbare tekengrootte van extra tekstregels, in mm. */
  lineSizeRange: { min: number; max: number };
  /** Pad naar de productfoto, aan te leveren door de eigenaar. */
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
  /** Prijs in centen voor afwerking "vlak". Null als niet beschikbaar voor deze vorm. */
  priceFlatCents: number | null;
  /** Prijs in centen voor afwerking "gewelfd". */
  priceCurvedCents: number | null;
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
