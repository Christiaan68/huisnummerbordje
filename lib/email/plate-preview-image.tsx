import { ImageResponse } from "next/og";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import { loadGoogleFont } from "@/lib/email/google-fonts";
import {
  DEFAULT_LINE_GAP_RATIO,
  FRAME_STROKE_WIDTH_RATIO,
  LINE_GAP_RATIO_BY_FONT,
  getContrastTextColor,
  getFrameBorderPath,
  getOvalFrameBorderPath,
  getScrewClearanceMarginsMm,
  getScrewPositions,
  getScrewRadiusMm,
} from "@/lib/configuration/plate-visual";

// Welk (vrij te gebruiken) Google Font er voor elk lettertype-optie in de
// e-mailafbeelding gebruikt wordt, en met welk gewicht (zie ProductPreview:
// alle preview-tekst is altijd vet/700).
//
// Alle 5 huidige lettertype-opties ("Fette Fraktur", "Bodoni", "Colonel",
// "Times", "Schwitserland Schmal" — zie config/product-options.ts) zijn
// zelf al Google Fonts, en worden ook al op de site zelf via
// next/font/google geladen (zie app/layout.tsx voor de precieze koppeling
// en de toelichting waarom dit — voor 3 van de 5 — vervangende lettertypes
// zijn, o.a. voor het betaalde Colonel/205TF). Daardoor is hier geen aparte
// substitutie nodig zoals vroeger bij de inmiddels verwijderde "Klassiek"/
// "Modern" (systeemlettertypes Georgia/Helvetica, niet los als bestand
// herverspreidbaar — zie lib/email/google-fonts.ts): dezelfde fontbestanden
// als in de live preview worden hier gewoon opnieuw opgehaald.
// `next/og` (Satori) accepts alleen deze specifieke lettergewichten voor
// `fonts[].weight` — een gewoon "number" is daar net te breed voor
// (TypeScript strict mode accepteert dat niet), vandaar deze letterlijke
// unie in plaats van `number`.
type SatoriFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

const FONT_CONFIG_BY_ID: Record<
  string,
  { googleFamily: string; weight: SatoriFontWeight }
> = {
  "fette-fraktur": { googleFamily: "UnifrakturCook", weight: 700 },
  bodoni: { googleFamily: "Bodoni Moda", weight: 700 },
  colonel: { googleFamily: "Saira Stencil One", weight: 400 },
  times: { googleFamily: "Tinos", weight: 700 },
  "schwitserland-schmal": { googleFamily: "Roboto Condensed", weight: 700 },
};
const FALLBACK_FONT_WEIGHT: SatoriFontWeight = 700;

export interface PlatePreviewImageInput {
  isOval: boolean;
  isCurved: boolean;
  isFramed: boolean;
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
 * Het lettertype wordt bij elke aanroep live bij Google Fonts opgehaald
 * (zie lib/email/google-fonts.ts) — dat vereist dat de server (Vercel)
 * internettoegang heeft, wat in productie het geval is. Lukt het ophalen
 * onverwacht niet (bv. Google Fonts tijdelijk onbereikbaar), dan valt de
 * afbeelding terug op het standaardlettertype van de renderer in plaats van
 * de hele afbeelding te laten mislukken — vorm, kleur, tekst, tekstgrootte
 * en schroefposities blijven dan alsnog kloppen, alleen het lettertype
 * wijkt in dat uitzonderingsgeval af.
 */
export async function renderPlatePreviewPng(
  input: PlatePreviewImageInput
): Promise<Buffer> {
  const {
    isOval,
    isCurved,
    isFramed,
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

  // Lettertype ophalen bij Google Fonts (zie FONT_CONFIG_BY_ID hierboven).
  // Lukt dit niet, dan renderen we gewoon door met het standaardlettertype
  // van de renderer — zie de toelichting bovenaan dit bestand.
  const fontConfig = FONT_CONFIG_BY_ID[fontId];
  let fontFamily: string | undefined;
  let fontWeight: SatoriFontWeight = FALLBACK_FONT_WEIGHT;
  let fonts: {
    name: string;
    data: ArrayBuffer;
    weight: SatoriFontWeight;
    style: "normal";
  }[] = [];

  if (fontConfig) {
    try {
      const data = await loadGoogleFont(fontConfig.googleFamily, fontConfig.weight);
      fontFamily = fontConfig.googleFamily;
      fontWeight = fontConfig.weight;
      fonts = [
        {
          name: fontConfig.googleFamily,
          data,
          weight: fontConfig.weight,
          style: "normal",
        },
      ];
    } catch (fontError) {
      console.error(
        `Ophalen van lettertype "${fontConfig.googleFamily}" voor de e-mailafbeelding is mislukt, val terug op het standaardlettertype:`,
        fontError instanceof Error ? fontError.message : fontError
      );
    }
  }

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

          {isFramed && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: plateWidthPx,
                height: plateHeightPx,
              }}
              viewBox={`0 0 ${widthMm} ${heightMm}`}
            >
              <path
                d={
                  isOval
                    ? getOvalFrameBorderPath(widthMm, heightMm)
                    : getFrameBorderPath(widthMm, heightMm)
                }
                fill="none"
                stroke={textColor}
                strokeWidth={Math.min(widthMm, heightMm) * FRAME_STROKE_WIDTH_RATIO}
              />
            </svg>
          )}

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
                  fontFamily,
                  fontWeight,
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
      fonts,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
