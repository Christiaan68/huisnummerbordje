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
  // Welk lettertype er voor elk tekstveld apart gebruikt wordt — bepaalt
  // hoe breed een karakter gemiddeld is (zie CHAR_WIDTH_RATIO_BY_FONT
  // hieronder) en hoeveel regelafstand dat lettertype nodig heeft (zie
  // LINE_GAP_RATIO_BY_FONT in plate-visual.ts). Sinds 28-8-2026 kan elk
  // tekstveld een eigen lettertype hebben (op verzoek van Christiaan, "stap
  // 5 en 7 combineren" — zie lib/configuration/steps.ts) — vandaar 3 losse
  // velden in plaats van 1 fontId voor het hele bordje. Onbekend/leeg →
  // de algemene standaardverhouding.
  numberFontId?: string | null;
  line1FontId?: string | null;
  line2FontId?: string | null;
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
// De waarden hieronder (huidige volledige lettertypelijst, zie
// config/product-options.ts) zijn een eerste, beredeneerde inschatting —
// net als de LINE_GAP_RATIO_BY_FONT-waarden voor dezelfde lettertypes in
// plate-visual.ts — nog niet visueel gecontroleerd. Bijstellen hier als het
// nummer in de preview bij een van deze lettertypes duidelijk te groot/
// klein oogt. Let op voor "commercial-script" (31-8-2026 toegevoegd): dit
// lettertype rendert, in tegenstelling tot alle andere hier, op gewicht
// Regular/400 in plaats van Bold/700 (zie FONT_WEIGHT_BY_ID in
// plate-visual.ts — Pinyon Script heeft geen vette variant) — de
// verhouding hieronder is dus niet zoals de andere bij 700 ingeschat, maar
// meteen bij het daadwerkelijke gewicht 400.
const CHAR_WIDTH_RATIO_BY_FONT: Record<string, number> = {
  "fette-fraktur": 0.7, // UnifrakturCook — sierlijke gotische druletter, relatief brede vormen
  bodoni: 0.66, // Bodoni Moda — hoog-contrast schreefletter, vergelijkbaar met Playfair Display
  colonel: 0.55, // Saira Stencil One — geometrisch, vrij smal/condensed stencil-lettertype
  times: 0.58, // Tinos (Times-vervanger) — van oudsher een compacte, smalle schreefletter
  "schwitserland-schmal": 0.52, // Roboto Condensed — smal/condensed lettertype
  "commercial-script": 0.55, // Pinyon Script (gewicht 400) — verbonden schrijfletter, gemiddelde tekenbreedte
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

function charWidthRatioFor(fontId: string | null | undefined): number {
  return fontId != null && fontId in CHAR_WIDTH_RATIO_BY_FONT
    ? CHAR_WIDTH_RATIO_BY_FONT[fontId]
    : DEFAULT_CHAR_WIDTH_RATIO;
}

function gapRatioFor(fontId: string | null | undefined): number {
  return fontId != null && fontId in LINE_GAP_RATIO_BY_FONT
    ? LINE_GAP_RATIO_BY_FONT[fontId]
    : DEFAULT_LINE_GAP_RATIO;
}

export function computeAutoFit(input: AutoFitInput): AutoFitResult {
  const {
    widthMm,
    heightMm,
    numberChars,
    line1Chars,
    line2Chars,
    minMarginXMm = 0,
    minMarginYMm = 0,
    numberFontId,
    line1FontId,
    line2FontId,
  } = input;

  const numberCharWidthRatio = charWidthRatioFor(numberFontId);
  const line1CharWidthRatio = charWidthRatioFor(line1FontId);
  const line2CharWidthRatio = charWidthRatioFor(line2FontId);

  const hasLine1 = Boolean(line1Chars && line1Chars > 0);
  const hasLine2 = Boolean(line2Chars && line2Chars > 0);

  // De regelafstand-verhouding (zie LINE_GAP_RATIO_BY_FONT in
  // plate-visual.ts) hoort eigenlijk bij een specifieke tussenruimte tussen
  // 2 regels — sinds elk tekstveld een eigen lettertype kan hebben
  // (28-8-2026) kunnen die per tussenruimte verschillen. Deze berekening
  // gebruikt bewust maar 1 schaalgetal voor de hele hoogteberekening (geen
  // aparte term per tussenruimte, dat was ook vóór deze wijziging al zo) —
  // daarvoor wordt de RUIMSTE (grootste) regelafstand van de betrokken
  // lettertypes gebruikt, zodat er nooit te weinig hoogte gereserveerd
  // wordt, ook niet als bijvoorbeeld het huisnummer een krap lettertype
  // heeft maar een tekstregel een ruim lettertype.
  const activeGapRatios = [
    gapRatioFor(numberFontId),
    ...(hasLine1 ? [gapRatioFor(line1FontId)] : []),
    ...(hasLine2 ? [gapRatioFor(line2FontId)] : []),
  ];
  const gapRatio = Math.max(...activeGapRatios);

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

  let numberSizeFromWidth =
    availableWidth / (Math.max(numberChars, 1) * numberCharWidthRatio);

  if (hasLine1 && line1Chars) {
    const limit =
      availableWidth /
      (line1Chars * line1CharWidthRatio * LINE1_TO_NUMBER_RATIO);
    numberSizeFromWidth = Math.min(numberSizeFromWidth, limit);
  }
  if (hasLine2 && line2Chars) {
    const limit =
      availableWidth /
      (line2Chars * line2CharWidthRatio * LINE2_TO_NUMBER_RATIO);
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