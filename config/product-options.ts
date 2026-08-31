import type {
  ProductColor,
  ProductFont,
  ProductShape,
  ProductSize,
} from "@/types/product";

export const productShapes: ProductShape[] = [
  {
    id: "nummer",
    name: "Huisnummer vierhoek",
    slug: "nummer",
    description: "Huisnummer, maximaal 5 tekens (letters en cijfers).",
    extraLines: 0,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/01 Bordje Huisnummer.jpg",
    active: true,
    createdAt: "",
  },
  {
    id: "nummer-1regel",
    name: "Huisnummer vierhoek + 1 regel",
    slug: "nummer-1regel",
    description:
      "Huisnummer (max. 5 tekens) met 1 extra tekstregel (max. 20 tekens).",
    extraLines: 1,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/02 Bordje Huisnummer met 1 regel.jpg",
    active: true,
    createdAt: "",
  },
  {
    id: "nummer-2regels",
    name: "Huisnummer vierhoek + 2 regels",
    slug: "nummer-2regels",
    description:
      "Huisnummer (max. 5 tekens) met 2 extra tekstregels (elk max. 20 tekens).",
    extraLines: 2,
    availableFinishes: ["vlak", "gewelfd"],
    imageSrc: "/images/shapes/03 Bordje Huisnummer met 2 regel.jpg",
    active: true,
    createdAt: "",
  },
  {
    id: "ovaal",
    name: "Huisnummer ovaal",
    slug: "ovaal",
    description: "Ovale vorm, huisnummer maximaal 5 tekens. Alleen gewelfd.",
    extraLines: 0,
    availableFinishes: ["gewelfd"],
    imageSrc: "/images/shapes/04 Bordje ovaal.jpg",
    active: true,
    createdAt: "",
  },
];

export const productColors: ProductColor[] = [
  { id: "black", name: "Zwart", slug: "black", hex: "#111111", ralCode: "RAL 9005", active: true, createdAt: "" },
  { id: "white", name: "Wit", slug: "white", hex: "#F7F5F0", ralCode: "RAL 9016", active: true, createdAt: "" },
  { id: "navy", name: "Donkerblauw", slug: "navy", hex: "#1B2A41", ralCode: "RAL 5002", active: true, createdAt: "" },
  { id: "cream", name: "Crème", slug: "cream", hex: "#EFE6D8", ralCode: "RAL 1013", active: true, createdAt: "" },
  { id: "green", name: "Groen", slug: "green", hex: "#2F4B3C", ralCode: "RAL 6012", active: true, createdAt: "" },
  { id: "red", name: "Rood", slug: "red", hex: "#7A2020", ralCode: "RAL 3004", active: true, createdAt: "" },
];

/**
 * Prijzen (priceFlatCents / priceCurvedCents) en defaultMaxChars hieronder
 * zijn een HANDMATIGE MOMENTOPNAME uit de prijsbeheeromgeving
 * (huisnummerbordjes-prijsbeheer), laatst bijgewerkt op 2026-08-15 uit
 * publicatieversie 11 (gepubliceerd 2026-08-15T09:28:28Z).
 *
 * Er is nog GEEN automatische koppeling: als er in de prijsbeheeromgeving
 * een nieuwe prijslijst gepubliceerd wordt, verschijnt dat NIET vanzelf
 * hier. Deze lijst moet dan opnieuw handmatig overgenomen worden (of er
 * moet, zoals besproken met de ontwikkelaar, een echte synchronisatie met
 * Supabase gebouwd worden — zie overdracht-ontwikkelaar.md).
 *
 * "Ovaal 125x175mm" (ovaal-125x175) had eerder een overduidelijk foutieve
 * waarde (€3402,00) in de prijsbeheeromgeving en stond daarom tijdelijk op
 * `null` ("Prijs volgt"). Christiaan heeft dit gecorrigeerd naar €34,02 en
 * opnieuw gepubliceerd — hieronder is de juiste waarde overgenomen.
 */
export const productSizes: ProductSize[] = [
  { id: "nummer-105x105", shapeId: "nummer", name: "105 × 105 mm", width: 105, height: 105, unit: "mm", priceFlatCents: 2262, priceCurvedCents: 2568, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-105x120", shapeId: "nummer", name: "105 × 120 mm", width: 120, height: 105, unit: "mm", priceFlatCents: 2323, priceCurvedCents: 2641, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-105x148", shapeId: "nummer", name: "105 × 148 mm", width: 148, height: 105, unit: "mm", priceFlatCents: 2495, priceCurvedCents: 2827, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-105x210", shapeId: "nummer", name: "105 × 210 mm", width: 210, height: 105, unit: "mm", priceFlatCents: 2785, priceCurvedCents: 3289, defaultMaxChars: 3, active: true, createdAt: "" },
  { id: "nummer-148x148", shapeId: "nummer", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: 2742, priceCurvedCents: 3595, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-148x210", shapeId: "nummer", name: "148 × 210 mm", width: 210, height: 148, unit: "mm", priceFlatCents: 2827, priceCurvedCents: 4256, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-210x210", shapeId: "nummer", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: 3130, priceCurvedCents: 4675, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "nummer-210x297", shapeId: "nummer", name: "210 × 297 mm", width: 297, height: 210, unit: "mm", priceFlatCents: 3650, priceCurvedCents: 5107, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "1regel-148x148", shapeId: "nummer-1regel", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: 3492, priceCurvedCents: 4343, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "1regel-148x210", shapeId: "nummer-1regel", name: "148 × 210 mm", width: 210, height: 148, unit: "mm", priceFlatCents: 3622, priceCurvedCents: 5035, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "1regel-210x210", shapeId: "nummer-1regel", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: 3924, priceCurvedCents: 5873, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "1regel-210x297", shapeId: "nummer-1regel", name: "210 × 297 mm", width: 297, height: 210, unit: "mm", priceFlatCents: 4386, priceCurvedCents: 6075, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "1regel-250x200", shapeId: "nummer-1regel", name: "250 × 200 mm", width: 200, height: 250, unit: "mm", priceFlatCents: 4760, priceCurvedCents: 6362, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "2regels-148x148", shapeId: "nummer-2regels", name: "148 × 148 mm", width: 148, height: 148, unit: "mm", priceFlatCents: 4039, priceCurvedCents: 4978, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "2regels-148x210", shapeId: "nummer-2regels", name: "148 × 210 mm", width: 210, height: 148, unit: "mm", priceFlatCents: 4109, priceCurvedCents: 5712, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "2regels-210x210", shapeId: "nummer-2regels", name: "210 × 210 mm", width: 210, height: 210, unit: "mm", priceFlatCents: 4429, priceCurvedCents: 6535, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "2regels-210x297", shapeId: "nummer-2regels", name: "210 × 297 mm", width: 297, height: 210, unit: "mm", priceFlatCents: 4962, priceCurvedCents: 6722, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "2regels-250x200", shapeId: "nummer-2regels", name: "250 × 200 mm", width: 200, height: 250, unit: "mm", priceFlatCents: 5412, priceCurvedCents: 7027, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "ovaal-105x150", shapeId: "ovaal", name: "105 × 150 mm", width: 150, height: 105, unit: "mm", priceFlatCents: null, priceCurvedCents: 3058, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "ovaal-125x175", shapeId: "ovaal", name: "125 × 175 mm", width: 175, height: 125, unit: "mm", priceFlatCents: null, priceCurvedCents: 3402, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "ovaal-143x183", shapeId: "ovaal", name: "143 × 183 mm", width: 183, height: 143, unit: "mm", priceFlatCents: null, priceCurvedCents: 3595, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "ovaal-160x210", shapeId: "ovaal", name: "160 × 210 mm", width: 210, height: 160, unit: "mm", priceFlatCents: null, priceCurvedCents: 4517, defaultMaxChars: 2, active: true, createdAt: "" },
  { id: "ovaal-220x300", shapeId: "ovaal", name: "220 × 300 mm", width: 300, height: 220, unit: "mm", priceFlatCents: null, priceCurvedCents: 8110, defaultMaxChars: 2, active: true, createdAt: "" },
];

// De oorspronkelijke 4 lettertypes (Klassiek/Georgia, Modern/Helvetica,
// Industrieel/Bebas Neue, Elegant/Playfair Display) zijn op 28-8-2026 op
// verzoek van Christiaan verwijderd, ten gunste van de eerste 5 lettertypes
// hieronder — de eerste 4 daarvan waren al diezelfde dag eerder
// toegevoegd, "Schwitserland Schmal" kwam er aansluitend nog bij.
// "Commercial Script" is op 31-8-2026 als 6e lettertype toegevoegd (zelfde
// verzoek: gebruik het Google Font "Pinyon Script", maar toon de klant de
// naam "Commercial Script" — zie app/layout.tsx voor de OFL-licentie- en
// gewicht-toelichting). cssFamily verwijst naar de CSS-variabelen die in
// app/layout.tsx via next/font/google worden geladen — zie de toelichting
// daar voor per lettertype welk (eventueel vervangend) Google Font
// daadwerkelijk gebruikt wordt en waarom. Belangrijk: name hieronder is de
// naam die de klant in de configurator ziet — dat is steeds de door
// Christiaan gevraagde naam, ook als er onder water een net iets ander
// (gratis) lettertype gebruikt wordt.
export const productFonts: ProductFont[] = [
  { id: "fette-fraktur", name: "Fette Fraktur", slug: "fette-fraktur", cssFamily: "var(--font-fette-fraktur), 'UnifrakturCook', serif", active: true, createdAt: "" },
  { id: "bodoni", name: "Bodoni", slug: "bodoni", cssFamily: "var(--font-bodoni), Georgia, serif", active: true, createdAt: "" },
  { id: "colonel", name: "Colonel", slug: "colonel", cssFamily: "var(--font-colonel), 'Saira Stencil One', sans-serif", active: true, createdAt: "" },
  { id: "times", name: "Times", slug: "times", cssFamily: "var(--font-times), 'Times New Roman', serif", active: true, createdAt: "" },
  { id: "schwitserland-schmal", name: "Schwitserland Schmal", slug: "schwitserland-schmal", cssFamily: "var(--font-roboto-condensed), 'Arial Narrow', sans-serif", active: true, createdAt: "" },
  { id: "commercial-script", name: "Commercial Script", slug: "commercial-script", cssFamily: "var(--font-commercial-script), cursive", active: true, createdAt: "" },
];

/**
 * Winkelbrede prijsopties (gelden voor alle producten, niet per maat) —
 * ook overgenomen uit de prijsbeheeromgeving, publicatieversie 11.
 *
 * standardColorIds: deze kleuren zijn inbegrepen in de basisprijs. Alle
 * overige kleuren (zie productColors hierboven) kosten colorSurchargeCents
 * extra. Beslist door Christiaan op 2026-08-15: zwart, wit en donkerblauw
 * zijn de standaardkleuren.
 *
 * frameSurchargeCents: de meerprijs voor de optionele kaderrand rond het
 * bordje (toegevoegd 25-8-2026). Kwam eerst uit het veld "specialCharPrice"
 * ("Meerprijs speciale tekens") van de prijsbeheeromgeving; heeft sinds
 * 27-8-2026 een eigen, apart veld daar ("Meerprijs kader" / framePrice) —
 * zie lib/configuration/livePricing.ts. De waarde hieronder is alleen nog
 * de vaste reservekopie voor als het live ophalen bij de prijstool niet
 * lukt.
 */
export const globalPricingOptions = {
  extraCharPriceCents: 636,
  colorSurchargeCents: 1505,
  frameSurchargeCents: 1000,
  standardColorIds: ["black", "white", "navy"] as string[],
};
