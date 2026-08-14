export interface AutoFitInput {
  widthMm: number;
  heightMm: number;
  numberChars: number;
  line1Chars: number | null;
  line2Chars: number | null;
}

export interface AutoFitResult {
  numberSizeMm: number;
  line1SizeMm: number | null;
  line2SizeMm: number | null;
}

const CHAR_WIDTH_RATIO = 0.62;
const LINE_HEIGHT_RATIO = 1.15;
const LINE1_TO_NUMBER_RATIO = 0.2;
const LINE2_TO_NUMBER_RATIO = 0.12;
const GAP_RATIO = 0.18;
const MARGIN_RATIO = 0.12;
const MIN_MARGIN_MM = 6;
const MIN_NUMBER_SIZE_MM = 15;

export function computeAutoFit(input: AutoFitInput): AutoFitResult {
  const { widthMm, heightMm, numberChars, line1Chars, line2Chars } = input;

  const marginMm = Math.max(
    MIN_MARGIN_MM,
    Math.min(widthMm, heightMm) * MARGIN_RATIO
  );
  const availableWidth = Math.max(widthMm - 2 * marginMm, 10);
  const availableHeight = Math.max(heightMm - 2 * marginMm, 10);

  const hasLine1 = Boolean(line1Chars && line1Chars > 0);
  const hasLine2 = Boolean(line2Chars && line2Chars > 0);

  let numberSizeFromWidth =
    availableWidth / (Math.max(numberChars, 1) * CHAR_WIDTH_RATIO);

  if (hasLine1 && line1Chars) {
    const limit =
      availableWidth / (line1Chars * CHAR_WIDTH_RATIO * LINE1_TO_NUMBER_RATIO);
    numberSizeFromWidth = Math.min(numberSizeFromWidth, limit);
  }
  if (hasLine2 && line2Chars) {
    const limit =
      availableWidth / (line2Chars * CHAR_WIDTH_RATIO * LINE2_TO_NUMBER_RATIO);
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