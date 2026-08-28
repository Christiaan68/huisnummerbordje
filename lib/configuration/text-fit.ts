import { LINE_GAP_RATIO_BY_FONT, DEFAULT_LINE_GAP_RATIO } from "./plate-visual";

export interface AutoFitInput {
  widthMm: number;
  heightMm: number;
  numberChars: number;
  line1Chars: number | null;
  line2Chars: number | null;
  // Extra marge (in mm) die vrijgehouden moet worden zodat de tekst niet
  // over de schroefjes heen loopt. Wordt door de aanroeper meegegeven op
  // basis van de werkelijke positie/grootte van de schroefjes voor de
  // gekozen vorm (rechthoekig vs ovaal) — zie ProductPreview.tsx.
  // Standaard 0 (geen extra marge, dus gelijk aan het oude gedrag).
  minMarginXMm?: number;
  minMarginYMm?: number;
  // Welk lettertype er gebruikt wordt voor het nummer — bepaalt hoe breed
  // een karakter gemiddeld is (zie CHAR_WIDTH_RATIO_BY_FONT hieronder).
  // Onbekend/leeg → de algemene standaardverhouding.
  fontId?: string;
}

export interface AutoFitResult {
  numberSizeMm: number;
  line1SizeMm: number | null;
  line2SizeMm: number | null;
}

// Gemiddelde breedte van een cijfer, als verhouding van de fontgrootte
// (breedte/fontsize), per lettertype — bij fontWeight 700 (vet), zoals de
// preview die altijd gebruikt. Dit voorkomt dat de tekst bij een breed
// lettertype te groot berekend wordt en over de schroefgaatjes heen loopt
// (oorspronkelijk ontdekt bij het inmiddels verwijderde lettertype
// "Klassiek"/Georgia, 19-8-2026 — vandaar dat dit per lettertype apart
// wordt bijgehouden in plaats van één algemene waarde).
//
// De 5 waarden hieronder (huidige volledige lettertypelijst, zie
// config/product-options.ts) zijn een eerste, beredeneerde inschatting —
// net als de LINE_GAP_RATIO_BY_FONT-waarden voor dezelfde lettertypes in
// plate-visual.ts — nog niet visueel gecontroleerd. Bijstellen hier als het
// nummer in de preview bij een van deze lettertypes duidelijk te groot/
// klein oogt.
const CHAR_WIDTH_RATIO_BY_FONT: Record<string, number> = {
  "fette-fraktur": 0.7, // UnifrakturCook — sierlijke gotische druletter, relatief brede vormen
  bodoni: 0.66, // Bodoni Moda — hoog-contrast schreefletter, vergelijkbaar met Playfair Display
  colonel: 0.55, // Saira Stencil One — geometrisch, vrij smal/condensed stencil-lettertype
  times: 0.58, // Tinos (Times-vervanger) — van oudsher een compacte, smalle schreefletter
  "schwitserland-schmal": 0.52, // Roboto Condensed — smal/condensed lettertype
};
const DEFAULT_CHAR_WIDTH_RATIO = 0.62;
// De regelhoogte in de echte preview is exact gelijk aan de fontgrootte
// (Tailwind's "leading-none", line-height:1) — niet 1.15 zoals deze
// berekening lang aannam. Die oude aanname reserveerde 15% meer hoogte dan
// er in werkelijkheid nodig is, waardoor het nummer op bordjes waar de
// hoogte (niet de breedte) de beperkende factor is — bijvoorbeeld brede,
// lage bordjes, of bordjes met 1 of 2 extra tekstregels — onnodig klein
// werd berekend. Deze waarde nu op 1 gezet zodat de berekening precies
// overeenkomt met wat er echt getekend wordt; dit maakt de tekst nergens
// kleiner, alleen (waar hoogte de beperking was) groter.
const LINE_HEIGHT_RATIO = 1;
const LINE1_TO_NUMBER_RATIO = 0.2;
const LINE2_TO_NUMBER_RATIO = 0.12;
// Marge rond de tekst — bewust klein gehouden. Bij rechthoekige bordjes
// wordt deze toch altijd overstemd door de (grotere) marge die nodig is om
// de schroefjes vrij te houden (zie getScrewClearanceMarginsMm hieronder),
// dus deze waarde heeft daar geen effect. Bij ovale bordjes geldt op de
// korte as géén schroefjes-marge (de schroefjes zitten bij een ovaal bordje
// alleen aan de lange as) — daar bepaalt deze waarde dus wel de ruimte, en
// is verkleind (was 0.12 / 6mm) om ook op ovale bordjes iets meer ruimte
// voor de tekst vrij te maken.
const MARGIN_RATIO = 0.09;
const MIN_MARGIN_MM = 5;
const MIN_NUMBER_SIZE_MM = 15;

export function computeAutoFit(input: AutoFitInput): AutoFitResult {
  const {
    widthMm,
    heightMm,
    numberChars,
    line1Chars,
    line2Chars,
    minMarginXMm = 0,
    minMarginYMm = 0,
    fontId,
  } = input;

  const charWidthRatio: number =
    fontId !== undefined && fontId in CHAR_WIDTH_RATIO_BY_FONT
      ? CHAR_WIDTH_RATIO_BY_FONT[fontId]
      : DEFAULT_CHAR_WIDTH_RATIO;

  // Dezelfde regelafstand-verhouding per lettertype die ook echt getekend
  // wordt (zie LINE_GAP_RATIO_BY_FONT in plate-visual.ts) — voorheen gebruikte
  // deze berekening altijd 0.18, terwijl Modern/Industrieel in werkelijkheid
  // maar 0.06 regelafstand tekenen. Daardoor werd bij bordjes met een extra
  // tekstregel onnodig veel hoogte gereserveerd voor de tussenruimte, vooral
  // bij Modern en Industrieel.
  const gapRatio: number =
    fontId !== undefined && fontId in LINE_GAP_RATIO_BY_FONT
      ? LINE_GAP_RATIO_BY_FONT[fontId]
      : DEFAULT_LINE_GAP_RATIO;

  const baseMarginMm = Math.max(
    MIN_MARGIN_MM,
    Math.min(widthMm, heightMm) * MARGIN_RATIO
  );
  // De marge mag nooit kleiner zijn dan wat nodig is om de schroefgaatjes
  // vrij te houden (minMarginXMm/minMarginYMm) — zie ProductPreview.tsx
  // voor hoe die op basis van de werkelijke schroefpositie/-grootte wordt
  // berekend.
  const marginXMm = Math.max(baseMarginMm, minMarginXMm);
  const marginYMm = Math.max(baseMarginMm, minMarginYMm);
  const availableWidth = Math.max(widthMm - 2 * marginXMm, 10);
  const availableHeight = Math.max(heightMm - 2 * marginYMm, 10);

  const hasLine1 = Boolean(line1Chars && line1Chars > 0);
  const hasLine2 = Boolean(line2Chars && line2Chars > 0);

  let numberSizeFromWidth =
    availableWidth / (Math.max(numberChars, 1) * charWidthRatio);

  if (hasLine1 && line1Chars) {
    const limit =
      availableWidth / (line1Chars * charWidthRatio * LINE1_TO_NUMBER_RATIO);
    numberSizeFromWidth = Math.min(numberSizeFromWidth, limit);
  }
  if (hasLine2 && line2Chars) {
    const limit =
      availableWidth / (line2Chars * charWidthRatio * LINE2_TO_NUMBER_RATIO);
    numberSizeFromWidth = Math.min(numberSizeFromWidth, limit);
  }

  const lineCount = 1 + (hasLine1 ? 1 : 0) + (hasLine2 ? 1 : 0);
  const heightFactor =
    LINE_HEIGHT_RATIO *
      (1 +
        (hasLine1 ? LINE1_TO_NUMBER_RATIO : 0) +
        (hasLine2 ? LINE2_TO_NUMBER_RATIO : 0)) +
    gapRatio * (lineCount - 1);
  const numberSizeFromHeight = availableHeight / heightFactor;

  const numberSizeMm = Math.max(
    MIN_NUMBER_SIZE_MM,
    Math.min(numberSizeFromWidth, numberSizeFromHeight)
  );

  return {
    numberSizeMm: Math.round(numberSizeMm),
    line1SizeMm: hasLine1
      ? Math.round(numberSizeMm * LINE1_TO_NUMBER_RATIO)
      : null,
    line2SizeMm: hasLine2
      ? Math.round(numberSizeMm * LINE2_TO_NUMBER_RATIO)
      : null,
  };
}