import { ImageResponse } from "next/og";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import { loadGoogleFont } from "@/lib/email/google-fonts";
import {
  DEFAULT_LINE_GAP_RATIO,
  EARS_AUTOFIT_FONT_KEY,
  FRAME_STROKE_WIDTH_RATIO,
  LINE_GAP_RATIO_BY_FONT,
  getContrastTextColor,
  getEarsGeometry,
  getFrameBorderPath,
  getOvalFrameBorderPath,
  getScrewClearanceMarginsMm,
  getScrewPositions,
  getScrewRadiusMm,
  type EarsStyle,
} from "@/lib/configuration/plate-visual";

// Welk (vrij te gebruiken) Google Font er voor elk lettertype-optie in de
// e-mailafbeelding gebruikt wordt, en met welk gewicht (zie ProductPreview:
// preview-tekst is normaal altijd vet/700 — behalve "Commercial Script",
// zie hieronder).
//
// Alle 6 huidige lettertype-opties ("Fette Fraktur", "Bodoni", "Colonel",
// "Times", "Schwitserland Schmal", "Commercial Script" — zie
// config/product-options.ts) zijn zelf al Google Fonts, en worden ook al op
// de site zelf via next/font/google geladen (zie app/layout.tsx voor de
// precieze koppeling en de toelichting waarom dit — voor een deel ervan —
// vervangende lettertypes zijn, o.a. voor het betaalde Colonel/205TF).
// Daardoor is hier geen aparte substitutie nodig zoals vroeger bij de
// inmiddels verwijderde "Klassiek"/"Modern" (systeemlettertypes Georgia/
// Helvetica, niet los als bestand herverspreidbaar — zie
// lib/email/google-fonts.ts): dezelfde fontbestanden als in de live preview
// worden hier gewoon opnieuw opgehaald.
// "Commercial Script" (Pinyon Script) bestaat bij Google Fonts alleen in
// gewicht 400 (Regular), vandaar hier weight: 400 in plaats van 700 zoals
// bij de meeste andere lettertypes.
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
  "commercial-script": { googleFamily: "Pinyon Script", weight: 400 },
};
const FALLBACK_FONT_WEIGHT: SatoriFontWeight = 700;

export interface PlatePreviewImageInput {
  // `isOval` blijft bestaan voor achterwaartse compatibiliteit met de
  // bestaande aanroep (sendOrderEmails.ts) en bepaalt, als `shapeKind` niet
  // is meegegeven, of dit een ovaal of rechthoekig bordje is — precies het
  // gedrag van vóór 9-9-2026. `shapeKind` (nieuw, 9-9-2026) is de eigenlijke
  // bron van waarheid en voegt een 3e mogelijkheid toe: "ears" voor de 3
  // nieuwe "oren"-vormen (colorMode "ears-and-plate", zie
  // types/product.ts). Nooit allebei tegenstrijdig invullen; als
  // `shapeKind` ontbreekt, wordt hij hieronder afgeleid uit `isOval`.
  isOval: boolean;
  shapeKind?: "rect" | "oval" | "ears";
  // Verplicht als shapeKind "ears" is — welke van de 3 "oren"-varianten
  // (zie getEarsGeometry in lib/configuration/plate-visual.ts).
  earsStyle?: EarsStyle;
  isCurved: boolean;
  isFramed: boolean;
  widthMm: number;
  heightMm: number;
  // Kleur van het bordje bij shapeKind "rect"/"oval" (bestaand gedrag). Bij
  // shapeKind "ears" is dit een fallback: als earColorHex/plateColorHex
  // hieronder niet zijn meegegeven, wordt colorHex voor beide gebruikt —
  // zodat een aanroeper die deze 2 nieuwe velden nog niet doorgeeft (bv.
  // omdat de bestel-/e-mailpijplijn voor de "oren"-vormen nog niet volledig
  // is aangesloten) toch een bruikbare (eenkleurige) afbeelding krijgt in
  // plaats van een crash of een lege plek.
  colorHex: string;
  // Losse kleuren voor shapeKind "ears" (colorMode "ears-and-plate", zie
  // types/configuration.ts: earColorId/plateColorId). Zie colorHex
  // hierboven voor het terugvalgedrag als deze ontbreken.
  earColorHex?: string;
  plateColorHex?: string;
  // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype (zie
  // lib/configuration/text-fit.ts / ProductPreview.tsx) — dus 3 losse
  // velden in plaats van 1 fontId voor het hele bordje. Bij shapeKind
  // "ears" wordt numberFontId genegeerd (er is bewust geen lettertypekeuze
  // voor deze vormen, zie EARS_NUMBER_FONT_STACK in plate-visual.ts) — mag
  // dus voor die vormen leeg blijven.
  numberFontId: string;
  line1FontId?: string | null;
  line2FontId?: string | null;
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
 * lib/email/sendOrderEmails.ts (sinds 29-8-2026; daarvoor stond dit
 * rechtstreeks in het inmiddels verwijderde app/api/send-email/route.ts).
 * Gebruikt dezelfde geometrie
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
    isCurved: isCurvedInput,
    isFramed,
    widthMm,
    heightMm,
    colorHex,
    earColorHex,
    plateColorHex,
    numberFontId,
    line1FontId,
    line2FontId,
    numberText,
    line1Text,
    line2Text,
    numberPosition,
  } = input;

  // shapeKind is de eigenlijke bron van waarheid (zie PlatePreviewImageInput
  // hierboven) — als een aanroeper 'm (nog) niet meegeeft, afgeleid uit het
  // bestaande `isOval` (achterwaartse compatibiliteit, exact het gedrag van
  // vóór 9-9-2026).
  const shapeKind = input.shapeKind ?? (isOval ? "oval" : "rect");
  const isEars = shapeKind === "ears";
  // Kleur van het middenvlak/oren bij een "oren"-bordje — valt terug op
  // colorHex (zie de toelichting bij PlatePreviewImageInput) als de
  // aanroeper de 2 losse kleuren nog niet doorgeeft.
  const plateFillHex = isEars ? plateColorHex ?? colorHex : colorHex;
  const earFillHex = isEars ? earColorHex ?? colorHex : colorHex;

  const ratio = widthMm / heightMm;
  const plateWidthPx = PLATE_PX_WIDTH;
  const plateHeightPx = Math.round(PLATE_PX_WIDTH / ratio);
  const pxPerMm = plateWidthPx / widthMm;

  // Tekstkleur: bij een "oren"-bordje altijd op basis van de PLAAT-kleur
  // (niet de oren-kleur, zelfde afspraak als in ProductPreview.tsx).
  const textColor = getContrastTextColor(plateFillHex);
  const screwPositions = isEars ? [] : getScrewPositions(isOval, widthMm, heightMm);
  const screwRadiusPx = getScrewRadiusMm(widthMm, heightMm) * pxPerMm;

  // Net als in ProductPreview.tsx (9-9-2026): de "gewelfd"-glansoverlay
  // hoort niet bij de "oren"-vormen (die kennen geen vlak/gewelfd-begrip) —
  // ongeacht wat de aanroeper voor `isCurved` meegeeft, hier altijd `false`
  // voor shapeKind "ears".
  const isCurved = isEars ? false : isCurvedInput;

  // Geometrie van het middenvlak + oren/hoekgaten (alleen bij shapeKind
  // "ears") — dezelfde functie als de live preview (ProductPreview.tsx),
  // zie lib/configuration/plate-visual.ts. `input.earsStyle` MOET gezet
  // zijn als shapeKind "ears" is (de aanroeper bepaalt welke van de 3
  // varianten dit is); zonder geldige earsStyle wordt er, defensief, geen
  // oren-tekening gemaakt (dan blijft het bordje leeg i.p.v. te crashen —
  // zie de aanroeper voor hoe earsStyle wordt meegegeven).
  const earsGeometry =
    isEars && input.earsStyle
      ? getEarsGeometry(input.earsStyle, widthMm, heightMm)
      : null;

  const hasLine1 = Boolean(line1Text && line1Text.length > 0);
  const hasLine2 = Boolean(line2Text && line2Text.length > 0);

  // Vierde argument (hasFrame): als het optionele kader aan staat, houdt
  // getScrewClearanceMarginsMm er ook rekening mee dat de tekst niet krap
  // tegen de kaderlijn aan mag komen (29-8-2026).
  //
  // "Oren"-vormen: zelfde aanpak als ProductPreview.tsx — de tekst wordt
  // gecentreerd in het (smallere/lagere) middenvlak, niet in het volledige
  // widthMm×heightMm-canvas. Bij alle 3 stijlen zitten de bevestigingsgaten
  // IN het kader eromheen, dus altijd BUITEN het middenvlak (zie
  // getEarsGeometry) — er is dan geen aparte schroef-marge nodig,
  // computeAutoFit's eigen basismarge volstaat voor alle 3.
  let fitWidthMm = widthMm;
  let fitHeightMm = heightMm;
  let minMarginXMm = 0;
  let minMarginYMm = 0;
  let autoFitNumberFontId: string = numberFontId;

  if (isEars && earsGeometry) {
    fitWidthMm = earsGeometry.innerRect.widthMm;
    fitHeightMm = earsGeometry.innerRect.heightMm;
    autoFitNumberFontId = EARS_AUTOFIT_FONT_KEY;
    // "vier-hoeken" gebruikte hier tot 12-9-2026 ook
    // getScrewClearanceMarginsMm — verwijderd om dezelfde reden als in
    // ProductPreview.tsx (zie de toelichting daar): dat telde de
    // schroefmarge dubbel op (eerst al verwerkt in de kaderdikte/
    // innerRect, dan nogmaals hier), waardoor het cijfer nodeloos klein
    // werd. Bij "vier-hoeken" zitten de gaten, net als bij
    // "horizontaal"/"verticaal", altijd al BUITEN het middenvlak —
    // computeAutoFit's eigen basismarge volstaat voor alle 3 stijlen.
  } else {
    const margins = getScrewClearanceMarginsMm(isOval, widthMm, heightMm, isFramed);
    minMarginXMm = margins.minMarginXMm;
    minMarginYMm = margins.minMarginYMm;
  }

  const fit = computeAutoFit({
    widthMm: fitWidthMm,
    heightMm: fitHeightMm,
    numberChars: numberText.length,
    line1Chars: hasLine1 ? (line1Text as string).length : null,
    line2Chars: hasLine2 ? (line2Text as string).length : null,
    minMarginXMm,
    minMarginYMm,
    numberFontId: autoFitNumberFontId,
    line1FontId,
    line2FontId,
  });

  const numberSizePx = fit.numberSizeMm * pxPerMm;
  const line1SizePx = fit.line1SizeMm ? fit.line1SizeMm * pxPerMm : 0;
  const line2SizePx = fit.line2SizeMm ? fit.line2SizeMm * pxPerMm : 0;

  // Lettertypes ophalen bij Google Fonts (zie FONT_CONFIG_BY_ID hierboven)
  // — 1 keer per UNIEK lettertype-id, ook als bv. huisnummer en tekstregel
  // 1 hetzelfde lettertype hebben. Lukt het ophalen voor een lettertype
  // niet, dan valt ALLEEN dat tekstveld terug op het standaardlettertype
  // van de renderer, de rest van de afbeelding blijft gewoon kloppen — zie
  // de toelichting bovenaan dit bestand.
  //
  // Bij shapeKind "ears" is er bewust GEEN door de klant kiesbaar
  // lettertype (vaste typografie) — maar dat vaste lettertype IS zelf wel
  // een Google Font (Bodoni Moda, zie EARS_NUMBER_FONT_STACK in
  // plate-visual.ts en FONT_CONFIG_BY_ID.bodoni hierboven), dus die moet
  // hier alsnog opgehaald worden (12-9-2026: hiervoor gebeurde dat expres
  // niet, met als onbedoeld gevolg dat de e-mailafbeelding terugviel op
  // Satori's eigen standaardlettertype i.p.v. Bodoni Moda). Die 3 vormen
  // hebben zelf geen tekstregels, dus hasLine1/hasLine2 zijn voor hen
  // altijd false — vandaar de aparte `isEars`-tak hieronder i.p.v. gewoon
  // numberFontId toe te voegen aan de normale lijst.
  const uniqueFontIds = isEars
    ? ["bodoni"]
    : Array.from(
        new Set(
          [numberFontId, hasLine1 ? line1FontId : null, hasLine2 ? line2FontId : null].filter(
            (id): id is string => Boolean(id)
          )
        )
      );

  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: SatoriFontWeight;
    style: "normal";
  }[] = [];
  const resolvedByFontId = new Map<
    string,
    { fontFamily: string; fontWeight: SatoriFontWeight }
  >();

  for (const id of uniqueFontIds) {
    const fontConfig = FONT_CONFIG_BY_ID[id];
    if (!fontConfig) continue;
    try {
      const data = await loadGoogleFont(fontConfig.googleFamily, fontConfig.weight);
      fonts.push({
        name: fontConfig.googleFamily,
        data,
        weight: fontConfig.weight,
        style: "normal",
      });
      resolvedByFontId.set(id, {
        fontFamily: fontConfig.googleFamily,
        fontWeight: fontConfig.weight,
      });
    } catch (fontError) {
      console.error(
        `Ophalen van lettertype "${fontConfig.googleFamily}" voor de e-mailafbeelding is mislukt, dat tekstveld valt terug op het standaardlettertype:`,
        fontError instanceof Error ? fontError.message : fontError
      );
    }
  }

  function resolveFont(id: string | null | undefined) {
    if (!id) return { fontFamily: undefined, fontWeight: FALLBACK_FONT_WEIGHT };
    const resolved = resolvedByFontId.get(id);
    return resolved
      ? { fontFamily: resolved.fontFamily, fontWeight: resolved.fontWeight }
      : { fontFamily: undefined, fontWeight: FALLBACK_FONT_WEIGHT };
  }

  function gapRatioFor(id: string | null | undefined): number {
    return id != null && id in LINE_GAP_RATIO_BY_FONT
      ? LINE_GAP_RATIO_BY_FONT[id]
      : DEFAULT_LINE_GAP_RATIO;
  }

  type Line = {
    text: string;
    sizePx: number;
    fontFamily: string | undefined;
    fontWeight: SatoriFontWeight;
    // Regelafstand BOVEN deze regel — hoort bij het lettertype van de
    // regel ERBOVEN, zie de toelichting bij dezelfde aanpak in
    // ProductPreview.tsx.
    gapRatio: number;
  };
  // Bij shapeKind "ears" altijd de vaste typografie (Bodoni Moda, zie
  // EARS_NUMBER_FONT_STACK in plate-visual.ts) i.p.v. een door de klant
  // gekozen lettertype — maar WEL via resolveFont("bodoni") opgehaald (zie
  // uniqueFontIds hierboven), want Satori kan niet overweg met de
  // CSS-custom-property-syntax van EARS_NUMBER_FONT_STACK
  // ("var(--font-bodoni), Georgia, serif") — dat werkt alleen in de
  // browser (ProductPreview.tsx). EARS_NUMBER_FONT_WEIGHT (700) komt
  // toevallig overeen met FONT_CONFIG_BY_ID.bodoni.weight, maar we nemen
  // hier bewust het gewicht dat ook daadwerkelijk is opgehaald.
  const numberLine: Line = isEars
    ? {
        text: numberText,
        sizePx: numberSizePx,
        ...resolveFont("bodoni"),
        gapRatio: gapRatioFor(EARS_AUTOFIT_FONT_KEY),
      }
    : {
        text: numberText,
        sizePx: numberSizePx,
        ...resolveFont(numberFontId),
        gapRatio: gapRatioFor(numberFontId),
      };
  const line1: Line | null = hasLine1
    ? {
        text: line1Text as string,
        sizePx: line1SizePx,
        ...resolveFont(line1FontId),
        gapRatio: gapRatioFor(line1FontId),
      }
    : null;
  const line2: Line | null = hasLine2
    ? {
        text: line2Text as string,
        sizePx: line2SizePx,
        ...resolveFont(line2FontId),
        gapRatio: gapRatioFor(line2FontId),
      }
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
            // Bij shapeKind "ears" komt de kleur NIET van deze ene
            // achtergrond (er zijn 2 losse kleuren, oren + vlak) maar van de
            // overlay-SVG hieronder (mainRect + oor-paden) — deze
            // achtergrond blijft dan transparant, zodat CANVAS_BG er "achter
            // vandaan" zichtbaar blijft op de plekken waar geen middenvlak/
            // oor getekend wordt (bv. de hoeken van het canvas bij
            // "horizontaal"/"verticaal", zie getEarsGeometry).
            backgroundColor: isEars ? "transparent" : plateFillHex,
            borderRadius: plateBorderRadius,
          }}
        >
          {isEars && earsGeometry && (
            // "Oren"-vormen: doorlopend kader (earFillHex, incl. de puntige
            // oren bij "horizontaal"/"verticaal") + middenvlak (plateFillHex)
            // erbovenop, getekend met dezelfde getEarsGeometry-functie en
            // dus dezelfde geometrie als de live preview
            // (components/configurator/ProductPreview.tsx) — zie
            // lib/configuration/plate-visual.ts.
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
              <path d={earsGeometry.framePath} fillRule="evenodd" fill={earFillHex} />
              <rect
                x={earsGeometry.innerRect.xMm}
                y={earsGeometry.innerRect.yMm}
                width={earsGeometry.innerRect.widthMm}
                height={earsGeometry.innerRect.heightMm}
                rx={earsGeometry.innerRect.radiusMm}
                fill={plateFillHex}
              />
            </svg>
          )}

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

          {isEars &&
            earsGeometry &&
            earsGeometry.holes.map((hole, index) => {
              const holeRadiusPx = hole.radiusMm * pxPerMm;
              if (hole.style === "plain") {
                // Kaal, schroefloos ophangoog — hoort bij "horizontaal"/
                // "verticaal" (op de aangeleverde productfoto's zijn dat
                // lege gaten, geen zichtbare schroeven).
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: hole.xMm * pxPerMm - holeRadiusPx,
                      top: hole.yMm * pxPerMm - holeRadiusPx,
                      width: holeRadiusPx * 2,
                      height: holeRadiusPx * 2,
                      borderRadius: "50%",
                      backgroundColor: "#2b2b2b",
                    }}
                  />
                );
              }
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    left: hole.xMm * pxPerMm - holeRadiusPx,
                    top: hole.yMm * pxPerMm - holeRadiusPx,
                    width: holeRadiusPx * 2,
                    height: holeRadiusPx * 2,
                    borderRadius: "50%",
                    backgroundColor: "#8f8f8f",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: holeRadiusPx * 1.1,
                      height: holeRadiusPx * 1.1,
                      borderRadius: "50%",
                      backgroundColor: "#c9c9c9",
                    }}
                  />
                </div>
              );
            })}

          {isFramed && !isEars && (
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
                    index === 0
                      ? 0
                      : orderedLines[index - 1].sizePx * orderedLines[index - 1].gapRatio,
                  fontSize: line.sizePx,
                  fontFamily: line.fontFamily,
                  fontWeight: line.fontWeight,
                  lineHeight: 1,
                  color: textColor,
                  // Zelfde reden als in ProductPreview.tsx (de live preview,
                  // 28-8-2026): de auto-fit-berekening is een inschatting,
                  // geen exacte lettertypemeting — whiteSpace "nowrap"
                  // voorkomt dat een tekstregel in de e-mailafbeelding ooit
                  // over 2 regels uiteenvalt.
                  whiteSpace: "nowrap",
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
