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
// preview die altijd gebruikt.
// "Klassiek" (Georgia) en "Elegant" (Playfair Display) zijn schreefletters
// met van huis uit brede, ruime cijfers — vooral in het vet nog breder.
// Doordat de oude, ene CHAR_WIDTH_RATIO (0.62) die extra breedte niet
// meenam, werd de tekst bij "Klassiek" te groot berekend en liep hij bij
// vijf tekens op een ovaal bordje (bv. "88888") over de schroefgaatjes heen
// — bij de andere (smallere) lettertypes gebeurde dat niet, omdat daar
// dezelfde 0.62 juist een (toevallige) overschatting was, wat extra
// speling gaf (gemeld door Christiaan, 19-8-2026).
const CHAR_WIDTH_RATIO_BY_FONT: Record<string, number> = {
  classic: 0.72, // Georgia (vet) — opvallend brede cijfers
  elegant: 0.68, // Playfair Display (vet) — brede schreefcijfers
  modern: 0.62, // Helvetica Neue/Arial (vet)
  industrial: 0.5, // Bebas Neue — smal/condensed lettertype
};
const DEFAULT_CHAR_WIDTH_RATIO = 0.62;
const LINE_HEIGHT_RATIO = 1.15;
const LINE1_TO_NUMBER_RATIO = 0.2;
const LINE2_TO_NUMBER_RATIO = 0.12;
const GAP_RATIO = 0.18;
const MARGIN_RATIO = 0.12;
const MIN_MARGIN_MM = 6;
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

  const charWidthRatio =
    (fontId && CHAR_WIDTH_RATIO_BY_FONT[fontId]) ?? DEFAULT_CHAR_WIDTH_RATIO;

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
    GAP_RATIO * (lineCount - 1);
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