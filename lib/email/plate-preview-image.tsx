import { ImageResponse } from "next/og";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import {
  DEFAULT_LINE_GAP_RATIO,
  LINE_GAP_RATIO_BY_FONT,
  getContrastTextColor,
  getScrewClearanceMarginsMm,
  getScrewPositions,
  getScrewRadiusMm,
} from "@/lib/configuration/plate-visual";

export interface PlatePreviewImageInput {
  isOval: boolean;
  isCurved: boolean;
  widthMm: number;
  heightMm: number;
  colorHex: string;
  fontId: string;
  numberText: string;
  line1Text?: string | null;
  line2Text?: string | null;
  numberPosition: "start" | "middle" | "end";
}

// Breedte van het bordje in de gegenereerde afbeelding, in pixels — ruim
// genoeg voor een scherpe weergave in de e-mail (die zelf 560px breed is,
// zie lib/email/templates/customer-confirmation.ts), maar niet zo groot dat
// de e-mail nodeloos zwaar wordt.
const PLATE_PX_WIDTH = 380;
const CANVAS_PAD_PX = 36;
const CANVAS_BG = "#f4f1ea";

/**
 * Genereert een PNG-voorbeeldafbeelding van het geconfigureerde bordje,
 * voor gebruik als (cid-)bijlage in de bevestigingsmail aan de klant — zie
 * app/api/send-email/route.ts. Gebruikt dezelfde geometrie
 * (schroefposities/-marges) en dezelfde automatische tekstgrootte als de
 * live preview in de configurator (components/configurator/ProductPreview.tsx),
 * via lib/configuration/plate-visual.ts en lib/configuration/text-fit.ts,
 * zodat de klant in de e-mail exact ziet wat hij/zij in de configurator
 * heeft samengesteld.
 *
 * Let op: dit is een vereenvoudigde weergave t.o.v. de live preview. Voor
 * e-mailafbeeldingen kan geen willekeurig lettertype gebruikt worden (het
 * moet als losse fontdata meegegeven worden, en de site gebruikt hiervoor
 * o.a. Georgia — een systeemfont dat niet los meegeleverd kan worden); deze
 * afbeelding gebruikt daarom het standaardlettertype van de renderer, niet
 * het door de klant gekozen lettertype. Vorm, kleur, tekst, tekstgrootte en
 * schroefposities kloppen wel exact.
 */
export async function renderPlatePreviewPng(
  input: PlatePreviewImageInput
): Promise<Buffer> {
  const {
    isOval,
    isCurved,
    widthMm,
    heightMm,
    colorHex,
    fontId,
    numberText,
    line1Text,
    line2Text,
    numberPosition,
  } = input;

  const ratio = widthMm / heightMm;
  const plateWidthPx = PLATE_PX_WIDTH;
  const plateHeightPx = Math.round(PLATE_PX_WIDTH / ratio);
  const pxPerMm = plateWidthPx / widthMm;

  const textColor = getContrastTextColor(colorHex);
  const screwPositions = getScrewPositions(isOval, widthMm, heightMm);
  const screwRadiusPx = getScrewRadiusMm(widthMm, heightMm) * pxPerMm;

  const hasLine1 = Boolean(line1Text && line1Text.length > 0);
  const hasLine2 = Boolean(line2Text && line2Text.length > 0);

  const { minMarginXMm, minMarginYMm } = getScrewClearanceMarginsMm(
    isOval,
    widthMm,
    heightMm
  );
  const fit = computeAutoFit({
    widthMm,
    heightMm,
    numberChars: numberText.length,
    line1Chars: hasLine1 ? (line1Text as string).length : null,
    line2Chars: hasLine2 ? (line2Text as string).length : null,
    minMarginXMm,
    minMarginYMm,
    fontId,
  });

  const numberSizePx = fit.numberSizeMm * pxPerMm;
  const line1SizePx = fit.line1SizeMm ? fit.line1SizeMm * pxPerMm : 0;
  const line2SizePx = fit.line2SizeMm ? fit.line2SizeMm * pxPerMm : 0;
  const gapRatio = LINE_GAP_RATIO_BY_FONT[fontId] ?? DEFAULT_LINE_GAP_RATIO;

  type Line = { text: string; sizePx: number };
  const numberLine: Line = { text: numberText, sizePx: numberSizePx };
  const line1: Line | null = hasLine1
    ? { text: line1Text as string, sizePx: line1SizePx }
    : null;
  const line2: Line | null = hasLine2
    ? { text: line2Text as string, sizePx: line2SizePx }
    : null;

  const extraLineCount = (hasLine1 ? 1 : 0) + (hasLine2 ? 1 : 0);
  let orderedLines: Line[];
  if (extraLineCount === 0) {
    orderedLines = [numberLine];
  } else if (extraLineCount === 1) {
    orderedLines =
      numberPosition === "end"
        ? [line1 as Line, numberLine]
        : [numberLine, line1 as Line];
  } else if (numberPosition === "middle") {
    orderedLines = [line1 as Line, numberLine, line2 as Line];
  } else if (numberPosition === "end") {
    orderedLines = [line1 as Line, line2 as Line, numberLine];
  } else {
    orderedLines = [numberLine, line1 as Line, line2 as Line];
  }

  const plateBorderRadius = isOval ? "50%" : Math.round(plateWidthPx * 0.04);
  const canvasWidth = plateWidthPx + CANVAS_PAD_PX * 2;
  const canvasHeight = plateHeightPx + CANVAS_PAD_PX * 2;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: canvasWidth,
          height: canvasHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: CANVAS_BG,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: plateWidthPx,
            height: plateHeightPx,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colorHex,
            borderRadius: plateBorderRadius,
          }}
        >
          {screwPositions.map(([xr, yr], index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                left: plateWidthPx * xr - screwRadiusPx,
                top: plateHeightPx * yr - screwRadiusPx,
                width: screwRadiusPx * 2,
                height: screwRadiusPx * 2,
                borderRadius: "50%",
                backgroundColor: "#8f8f8f",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: screwRadiusPx * 1.1,
                  height: screwRadiusPx * 1.1,
                  borderRadius: "50%",
                  backgroundColor: "#c9c9c9",
                }}
              />
            </div>
          ))}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {orderedLines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  marginTop:
                    index === 0 ? 0 : orderedLines[index - 1].sizePx * gapRatio,
                  fontSize: line.sizePx,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: textColor,
                }}
              >
                {line.text}
              </div>
            ))}
          </div>

          {isCurved && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: plateBorderRadius,
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)",
              }}
            />
          )}
        </div>
      </div>
    ),
    {
      width: canvasWidth,
      height: canvasHeight,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
