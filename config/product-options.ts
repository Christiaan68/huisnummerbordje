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
    // Capability-vlaggen (zie types/product.ts) — expliciet ingevuld met het
    // bestaande gedrag van deze vorm, niets impliciet gelaten.
    hasSizeChoice: true,
    hasFinishChoice: true,
    hasFontChoice: true,
    hasFrameChoice: true,
    colorMode: "single",
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
    hasSizeChoice: true,
    hasFinishChoice: true,
    hasFontChoice: true,
    hasFrameChoice: true,
    colorMode: "single",
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
    hasSizeChoice: true,
    hasFinishChoice: true,
    hasFontChoice: true,
    hasFrameChoice: true,
    colorMode: "single",
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
    hasSizeChoice: true,
    hasFinishChoice: true,
    hasFontChoice: true,
    hasFrameChoice: true,
    colorMode: "single",
  },

  // -------------------------------------------------------------------
  // Nieuw 9-9-2026: 3 vormen in jaren-30-stijl met bevestigingsogen
  // ("oren"). Structureel anders dan de 4 vormen hierboven: precies 1
  // vaste maat, geen vlak/gewelfd-keuze, geen lettertypekeuze, geen
  // kaderoptie, en 2 losse verplichte kleuren (oren + vlak) uit een
  // volledig aparte kleurenlijst (productColorsOren, zie verderop in dit
  // bestand). Zie types/product.ts (capability-vlaggen) en
  // lib/configuration/shape-helpers.ts.
  //
  // `availableFinishes: []`: deze vormen kennen het begrip vlak/gewelfd
  // niet — een lege lijst is de meest neutrale invulling van dit
  // (voor deze vormen ongebruikte) veld. Bestaande code die
  // `availableFinishes` leest (bv. de SET_SHAPE-reducer in
  // ConfiguratorContext.tsx: "lengte 1 → die ene afwerking, anders null")
  // komt hierdoor vanzelf op `finish: null` uit — precies wat
  // `hasFinishChoice: false` voor deze vormen vereist. FinishSelector.tsx
  // en de "afwerking"-stap worden hoe dan ook nooit getoond voor deze
  // vormen (zie lib/configuration/steps.ts, visibleFor).
  //
  // Basisprijs (priceFlatCents/priceCurvedCents) van de bijbehorende maten
  // hieronder staat bewust op `null` ("prijs op aanvraag") totdat
  // Christiaan deze 3 producten zelf in de prijsbeheeromgeving aanmaakt.
  {
    id: "oren-2-horizontaal",
    name: "Huisnummer met 2 oren",
    slug: "oren-2-horizontaal",
    description:
      "Huisnummerbordje in jaren-30-stijl met bevestigingsogen links en rechts. Vaste maat 130 × 100 mm. Huisnummer: 1-4 cijfers, optioneel max. 3 letters.",
    extraLines: 0,
    availableFinishes: [],
    imageSrc: "/images/shapes/05 Bordje Huisnummer 2 oren.jpg",
    active: true,
    createdAt: "",
    hasSizeChoice: false,
    hasFinishChoice: false,
    hasFontChoice: false,
    hasFrameChoice: false,
    colorMode: "ears-and-plate",
  },
  {
    id: "oren-2-verticaal",
    name: "Huisnummer met 2 oren verticaal",
    slug: "oren-2-verticaal",
    description:
      "Huisnummerbordje in jaren-30-stijl met bevestigingsogen boven en onder. Vaste maat 100 × 130 mm. Huisnummer: 1-4 cijfers, optioneel max. 3 letters.",
    extraLines: 0,
    availableFinishes: [],
    imageSrc: "/images/shapes/06 Bordje Huisnummer 2 oren verticaal.jpg",
    active: true,
    createdAt: "",
    hasSizeChoice: false,
    hasFinishChoice: false,
    hasFontChoice: false,
    hasFrameChoice: false,
    colorMode: "ears-and-plate",
  },
  {
    id: "oren-4-hoeken",
    name: "Huisnummer met 4 oren",
    slug: "oren-4-hoeken",
    description:
      "Huisnummerbordje in jaren-30-stijl met bevestiging op de vier hoeken. Vaste maat 160 × 160 mm. Huisnummer: 1-4 cijfers, optioneel max. 3 letters.",
    extraLines: 0,
    availableFinishes: [],
    imageSrc: "/images/shapes/07 Bordje Huisnummer 4 oren.jpg",
    active: true,
    createdAt: "",
    hasSizeChoice: false,
    hasFinishChoice: false,
    hasFontChoice: false,
    hasFrameChoice: false,
    colorMode: "ears-and-plate",
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
 * Aparte, volledig losstaande kleurenlijst voor de 3 "oren"-vormen (zie
 * productShapes hierboven, colorMode "ears-and-plate") — toegevoegd
 * 9-9-2026. Bewust NIET gemengd met `productColors` hierboven: geen enkele
 * id overlapt (allemaal met het voorvoegsel "oren-"), ook niet als een
 * kleurnaam/RAL-code toevallig lijkt op een bestaande kleur.
 *
 * Wordt bij deze vormen gebruikt voor TWEE losse, allebei verplichte
 * kleurkeuzes (oren + vlak, zie ConfiguratorSelection.earColorId /
 * plateColorId in types/configuration.ts) — nooit voor de gewone,
 * enkelvoudige `colorId`.
 *
 * LET OP: de hex-waarden hieronder zijn een visuele BENADERING van de
 * genoemde RAL-code, bedoeld voor het scherm-voorbeeld in de configurator —
 * niet de exacte drukkleur van het geëmailleerde bordje zelf.
 */
export const productColorsOren: ProductColor[] = [
  { id: "oren-zwart", name: "Zwart", slug: "oren-zwart", hex: "#111111", ralCode: "RAL 9005", active: true, createdAt: "" },
  { id: "oren-wit", name: "Wit", slug: "oren-wit", hex: "#F7F5F0", ralCode: "RAL 9016", active: true, createdAt: "" },
  { id: "oren-donkerblauw", name: "Donkerblauw", slug: "oren-donkerblauw", hex: "#1E2A4A", ralCode: "RAL 5013", active: true, createdAt: "" },
  { id: "oren-creme", name: "Crème", slug: "oren-creme", hex: "#E9E0CB", ralCode: "RAL 9001", active: true, createdAt: "" },
  { id: "oren-groen", name: "Groen", slug: "oren-groen", hex: "#27392C", ralCode: "RAL 6009", active: true, createdAt: "" },
  { id: "oren-rood", name: "Rood", slug: "oren-rood", hex: "#7E292C", ralCode: "RAL 3011", active: true, createdAt: "" },
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

  // Nieuw 9-9-2026: de 3 "oren"-vormen hebben elk precies 1 vaste maat (zie
  // ProductShape.hasSizeChoice) — de klant kiest hier dus niets, zie
  // ConfiguratorContext.tsx (SET_SHAPE zet sizeId meteen op deze ene maat).
  //
  // priceFlatCents/priceCurvedCents staan BEWUST op `null` ("prijs op
  // aanvraag") — de basisprijs van deze 3 nieuwe producten is nog niet
  // vastgesteld door Christiaan. Hij vult die zelf in via de bestaande
  // prijsbeheertool, net als bij alle andere producten (zie ook de
  // toelichting bij PRIJSTOOL_ID_NAAR_WEBSHOP_ID in
  // lib/configuration/livePricing.ts). calculatePrice() valt zolang dat niet
  // gebeurd is terug op hetzelfde "prijs op aanvraag"-pad als nu al bestaat
  // voor bv. "ovaal-105x150" hierboven.
  //
  // defaultMaxChars: 7 = 4 cijfers + 3 letters, het maximum van de eigen
  // validatie voor deze vormen (zie lib/validation/text-input.schema.ts,
  // houseNumberEarsSchema). Dit veld speelt voor deze vormen eigenlijk geen
  // rol in de prijsberekening: doordat de validatie al een harde grens van
  // 7 tekens afdwingt, kan de tekst nooit langer worden dan defaultMaxChars
  // — er kunnen dus nooit "extra tekens" bovenop dit aantal zijn (zie
  // lib/configuration/pricing.ts). Het veld staat hier toch consistent
  // ingevuld voor het type, en zodat een eventuele toekomstige verruiming
  // van de validatie niet per ongeluk een `undefined` tegenkomt.
  { id: "oren-2-horizontaal-130x100", shapeId: "oren-2-horizontaal", name: "130 × 100 mm", width: 130, height: 100, unit: "mm", priceFlatCents: null, priceCurvedCents: null, defaultMaxChars: 7, active: true, createdAt: "" },
  { id: "oren-2-verticaal-100x130", shapeId: "oren-2-verticaal", name: "100 × 130 mm", width: 100, height: 130, unit: "mm", priceFlatCents: null, priceCurvedCents: null, defaultMaxChars: 7, active: true, createdAt: "" },
  { id: "oren-4-hoeken-160x160", shapeId: "oren-4-hoeken", name: "160 × 160 mm", width: 160, height: 160, unit: "mm", priceFlatCents: null, priceCurvedCents: null, defaultMaxChars: 7, active: true, createdAt: "" },
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
  // NIEUW — toegevoegd voor de 3 jaren-30-vormen met oren (9-9-2026). Deze
  // vormen hebben een eigen, aparte kleurenlijst (productColorsOren) en 2
  // losse, verplichte kleurkeuzes (oren + vlak). Christiaan heeft bevestigd
  // dat de toeslag voor een meerprijskleur bij deze vormen exact hetzelfde
  // bedrag is als de bestaande `colorSurchargeCents` hierboven (dezelfde
  // instelling als "Meerprijs andere kleur" in de prijstool — er is geen
  // apart, nieuw instelbaar bedrag nodig) en dat de toeslag PER ONDERDEEL
  // geldt: als zowel de oren als het vlak een meerprijskleur krijgen, telt
  // colorSurchargeCents dus 2x mee (zie lib/configuration/pricing.ts).
  orenStandardColorIds: ["oren-zwart", "oren-wit", "oren-donkerblauw"] as string[],
};
