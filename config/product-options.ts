import type {
  ProductColor,
  ProductFont,
  ProductShape,
  ProductSize,
} from "@/types/product";

/**
 * Fallback/seed-data. Zodra Supabase-integratie (FASE 11) actief is,
 * komt deze data uit de database.
 *
 * LET OP — PRIJZEN: priceFlatCents / priceCurvedCents staan hieronder op
 * `null`. Deze moeten later ingevuld worden (in centen, dus €22,62 = 2262).
 * Zolang deze `null` zijn, toont de configurator "prijs op aanvraag".
 */

export const productShapes: ProductShape[] = [
  {
    id: "nummer",
    name: "Huisnummer",
    slug: "nummer",
    description: "Huisnummer, maximaal 2 tekens.",
    extraLines: 0,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/01 Bordje Huisnummer.jpg",
    characterSizeRange: { min: 60, max: 400 },
    lineSizeRange: { min: 10, max: 120 },
    active: true,
    createdAt: "",
  },
  {
    id: "nummer-1regel",
    name: "Huisnummer + 1 regel",
    slug: "nummer-1regel",
    description:
      "Huisnummer (max. 2 tekens) met 1 extra tekstregel (max. 20 tekens).",
    extraLines: 1,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/02 Bordje Huisnummer met 1 regel.jpg",
    characterSizeRange: { min: 60, max: 400 },
    lineSizeRange: { min: 10, max: 120 },
    active: true,
    createdAt: "",
  },
  {
    id: "nummer-2regels",
    name: "Huisnummer + 2 regels",
    slug: "nummer-2regels",
    description:
      "Huisnummer (max. 2 tekens) met 2 extra tekstregels (elk max. 20 tekens).",
    extraLines: 2,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/03 Bordje Huisnummer met 2 regel.jpg",
    characterSizeRange: { min: 60, max: 400 },
    lineSizeRange: { min: 10, max: 120 },
    active: true,
    createdAt: "",
  },
  {
    id: "ovaal",
    name: "Huisnummer ovaal",
    slug: "ovaal",
    description: "Ovale vorm, huisnummer maximaal 2 tekens. Alleen gewelfd.",
    extraLines: 0,
    availableFinishes: ["gewelfd"],
    imageSrc: "/images/shapes/04 Bordje ovaal.jpg",
    characterSizeRange: { min: 60, max: 400 },
    lineSizeRange: { min: 10, max: 120 },
    active: true,
    createdAt: "",
  },
];

export const productColors: ProductColor[] = [
  { id: "black", name: "Zwart", slug: "black", hex: "#111111", active: true, createdAt: "" },
  { id: "white", name: "Wit", slug: "white", hex: "#F7F5F0", active: true, createdAt: "" },
  { id: "cream", name: "Crème", slug: "cream", hex: "#EFE6D8", active: true, createdAt: "" },
  { id: "navy", name: "Donkerblauw", slug: "navy", hex: "#1B2A41", active: true, createdAt: "" },
  { id: "green", name: "Groen", slug: "green", hex: "#2F4B3C", active: true, createdAt: "" },
  { id: "red", name: "Rood", slug: "red", hex: "#7A2020", active: true, createdAt: "" },
];

// Maten per vorm. Prijzen zijn TODO (null) — later in te vullen in centen.
export const productSizes: ProductSize[] = [
  // Vorm: Huisnummer (0 regels)
  { id: "nummer-105x105", shapeId: "nummer", name: "105 × 105 mm", width: 105, height: 105, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-105x120", shapeId: "nummer", name: "105 × 120 mm", width: 105, height: 120, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-105x148", shapeId: "nummer", name: "105 × 148 mm", width: 105, height: 148, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-105x210", shapeId: "nummer", name: "105 × 210 mm", width: 105, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-148x148", shapeId: "nummer", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-148x210", shapeId: "nummer", name: "148 × 210 mm", width: 148, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-210x210", shapeId: "nummer", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "nummer-210x297", shapeId: "nummer", name: "210 × 297 mm", width: 210, height: 297, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },

  // Vorm: Huisnummer + 1 regel
  { id: "1regel-148x148", shapeId: "nummer-1regel", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "1regel-148x210", shapeId: "nummer-1regel", name: "148 × 210 mm", width: 148, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "1regel-210x210", shapeId: "nummer-1regel", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "1regel-210x297", shapeId: "nummer-1regel", name: "210 × 297 mm", width: 210, height: 297, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "1regel-250x200", shapeId: "nummer-1regel", name: "250 × 200 mm", width: 250, height: 200, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },

  // Vorm: Huisnummer + 2 regels
  { id: "2regels-148x148", shapeId: "nummer-2regels", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "2regels-148x210", shapeId: "nummer-2regels", name: "148 × 210 mm", width: 148, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "2regels-210x210", shapeId: "nummer-2regels", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "2regels-210x297", shapeId: "nummer-2regels", name: "210 × 297 mm", width: 210, height: 297, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "2regels-250x200", shapeId: "nummer-2regels", name: "250 × 200 mm", width: 250, height: 200, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },

  // Vorm: Ovaal (alleen gewelfd)
  { id: "ovaal-105x150", shapeId: "ovaal", name: "105 × 150 mm", width: 105, height: 150, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "ovaal-125x175", shapeId: "ovaal", name: "125 × 175 mm", width: 125, height: 175, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "ovaal-143x183", shapeId: "ovaal", name: "143 × 183 mm", width: 143, height: 183, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "ovaal-160x210", shapeId: "ovaal", name: "160 × 210 mm", width: 160, height: 210, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
  { id: "ovaal-220x300", shapeId: "ovaal", name: "220 × 300 mm", width: 220, height: 300, unit: "mm", priceFlatCents: null, priceCurvedCents: null, active: true, createdAt: "" },
];

export const productFonts: ProductFont[] = [
  { id: "classic", name: "Klassiek", slug: "classic", cssFamily: "Georgia, 'Times New Roman', serif", active: true, createdAt: "" },
  { id: "modern", name: "Modern", slug: "modern", cssFamily: "'Helvetica Neue', Arial, sans-serif", active: true, createdAt: "" },
  { id: "industrial", name: "Industrieel", slug: "industrial", cssFamily: "var(--font-bebas), 'Arial Narrow', sans-serif", active: true, createdAt: "" },
  { id: "elegant", name: "Elegant", slug: "elegant", cssFamily: "var(--font-playfair), Georgia, serif", active: true, createdAt: "" },
];
