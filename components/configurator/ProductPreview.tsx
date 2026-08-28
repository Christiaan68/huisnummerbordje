"use client";

import { useLayoutEffect, useRef } from "react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";
import { computeAutoFit } from "@/lib/configuration/text-fit";
import { calculatePrice, formatPriceCents } from "@/lib/configuration/pricing";
import {
  DEFAULT_OVAL_RATIO,
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

const PREVIEW_WIDTH_PX = 260;

export function ProductPreview() {
  const { selection } = useConfigurator();
  const pricingData = usePricingData();
  const plateRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const color = productColors.find((c) => c.id === selection.colorId);
  const size = pricingData.productSizes.find((s) => s.id === selection.sizeId);
  const price = calculatePrice(selection, pricingData);

  // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype (op verzoek
  // van Christiaan — de losse stap "Lettertype" is vervallen, dat wordt nu
  // in stap 5 ("Tekst") per veld gekozen, zie TextInput.tsx). Zolang de
  // klant voor een veld nog niets gekozen heeft (bv. op een eerdere stap,
  // vóórdat stap 5 bereikt is, of simpelweg nog niet aangeklikt), valt de
  // preview terug op "Times" als neutrale placeholder — zelfde aanpak als
  // vroeger (toen nog vóór de introductie van per-veld lettertypes) met de
  // toenmalige "Modern"-placeholder.
  const previewFallbackFont = productFonts.find((f) => f.id === "times");
  const numberFont =
    productFonts.find((f) => f.id === selection.numberFontId) ??
    previewFallbackFont;
  const line1Font =
    productFonts.find((f) => f.id === selection.line1FontId) ??
    previewFallbackFont;
  const line2Font =
    productFonts.find((f) => f.id === selection.line2FontId) ??
    previewFallbackFont;

  const isOval = shape?.id === "ovaal";
  const ratio = size ? size.width / size.height : isOval ? DEFAULT_OVAL_RATIO : 1;
  const textColor = color ? getContrastTextColor(color.hex) : undefined;
  const fallbackFontFamily = "var(--font-fraunces), Georgia, serif";
  const numberFontFamily = numberFont?.cssFamily ?? fallbackFontFamily;
  const line1FontFamily = line1Font?.cssFamily ?? fallbackFontFamily;
  const line2FontFamily = line2Font?.cssFamily ?? fallbackFontFamily;

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;
  const isCurved = selection.finish !== "vlak";

  // Afmetingen van het bordje (in mm, zoals gekozen bij "Maat"). Nog geen
  // maat gekozen? Dan een neutrale placeholder — voor een ovaal bordje al
  // met de juiste ovale verhouding (zie DEFAULT_OVAL_RATIO hierboven),
  // voor de andere vormen gewoon 100×100, puur om de preview al iets te
  // laten tonen.
  const plateWidth = size?.width ?? (isOval ? 100 * DEFAULT_OVAL_RATIO : 100);
  const plateHeight = size?.height ?? 100;
  const plateFill = color?.hex ?? "hsl(var(--secondary))";

  const numberText = selection.customText || "12";
  const line1Text = selection.extraLine1 || "Voorbeeldtekst";
  const line2Text = selection.extraLine2 || "Voorbeeldtekst";

  let numberFontSize = 34;
  let line1FontSize = 14;
  let line2FontSize = 14;

  if (size) {
    // Hoeveel marge er minstens vrij moet blijven zodat de tekst niet over
    // de schroefjes heen loopt — berekend uit de werkelijke positie/grootte
    // van de schroefjes hierboven (screwPositions/screwRadius worden verderop
    // met dezelfde formules bepaald). Rechthoekig bordje: 4 schroefjes in de
    // hoeken, dus zowel horizontaal als verticaal marge nodig. Ovaal bordje:
    // 2 schroefjes op de langste as (dus horizontaal bij een liggende ovaal,
    // verticaal bij een staande) — op de korte as staan ze in het midden,
    // dus daar is geen extra marge nodig (gemeld door Christiaan, 19-8-2026,
    // n.a.v. "88888" op een ovaal bordje dat de gaatjes overschreef).
    const { minMarginXMm, minMarginYMm } = getScrewClearanceMarginsMm(
      isOval,
      size.width,
      size.height
    );

    const fit = computeAutoFit({
      widthMm: size.width,
      heightMm: size.height,
      numberChars: numberText.length,
      line1Chars: hasLine1 ? line1Text.length : null,
      line2Chars: hasLine2 ? line2Text.length : null,
      minMarginXMm,
      minMarginYMm,
      numberFontId: numberFont?.id,
      line1FontId: line1Font?.id,
      line2FontId: line2Font?.id,
    });
    const pxPerMm = PREVIEW_WIDTH_PX / size.width;
    numberFontSize = fit.numberSizeMm * pxPerMm;
    line1FontSize = fit.line1SizeMm ? fit.line1SizeMm * pxPerMm : line1FontSize;
    line2FontSize = fit.line2SizeMm ? fit.line2SizeMm * pxPerMm : line2FontSize;
  }

  // Regelafstand boven een regel — sinds elk tekstveld een eigen
  // lettertype kan hebben, hoort de regelafstand bóven een regel bij het
  // lettertype van de regel DAARBOVEN (dat lettertype bepaalt hoeveel
  // "lucht" er van nature onder de tekst zit, zie LINE_GAP_RATIO_BY_FONT in
  // plate-visual.ts). Hieronder per node vastgelegd welk lettertype-id
  // erbij hoort, zodat de juiste regelafstand-verhouding gebruikt kan
  // worden bij het samenstellen van de uiteindelijke volgorde hieronder.
  const numberGapRatio =
    LINE_GAP_RATIO_BY_FONT[numberFont?.id ?? ""] ?? DEFAULT_LINE_GAP_RATIO;
  const line1GapRatio =
    LINE_GAP_RATIO_BY_FONT[line1Font?.id ?? ""] ?? DEFAULT_LINE_GAP_RATIO;
  const line2GapRatio =
    LINE_GAP_RATIO_BY_FONT[line2Font?.id ?? ""] ?? DEFAULT_LINE_GAP_RATIO;

  // fontWeight: 700 (vet) op alle preview-tekst — zo lijkt de preview meer
  // op een echt geëmailleerd bordje, waar het nummer altijd dik/opvallend
  // gedrukt is (zie referentiefoto van Christiaan, 19-8-2026).
  const numberNode = (
    <span
      key="number"
      className="leading-none"
      style={{
        fontFamily: numberFontFamily,
        fontSize: `${numberFontSize}px`,
        fontWeight: 700,
      }}
    >
      {numberText}
    </span>
  );
  const line1Node = hasLine1 ? (
    <span
      key="line1"
      className="leading-none"
      style={{
        fontFamily: line1FontFamily,
        fontSize: `${line1FontSize}px`,
        fontWeight: 700,
      }}
    >
      {line1Text}
    </span>
  ) : null;
  const line2Node = hasLine2 ? (
    <span
      key="line2"
      className="leading-none"
      style={{
        fontFamily: line2FontFamily,
        fontSize: `${line2FontSize}px`,
        fontWeight: 700,
      }}
    >
      {line2Text}
    </span>
  ) : null;

  const extraLineCount = (hasLine1 ? 1 : 0) + (hasLine2 ? 1 : 0);
  let orderedNodes: (JSX.Element | null)[];
  let orderedSizes: number[];
  // Gapratio per node in de volgorde hieronder — de marge BOVEN een regel
  // gebruikt de gapratio van de regel ERBOVEN (dat lettertype bepaalt hoe
  // veel "lucht" er van nature onder die tekst zit), zie de toelichting bij
  // numberGapRatio/line1GapRatio/line2GapRatio hierboven.
  let orderedGapRatios: number[];
  if (extraLineCount === 0) {
    orderedNodes = [numberNode];
    orderedSizes = [numberFontSize];
    orderedGapRatios = [numberGapRatio];
  } else if (extraLineCount === 1) {
    orderedNodes = selection.numberPosition === "end" ? [line1Node, numberNode] : [numberNode, line1Node];
    orderedSizes =
      selection.numberPosition === "end"
        ? [line1FontSize, numberFontSize]
        : [numberFontSize, line1FontSize];
    orderedGapRatios =
      selection.numberPosition === "end"
        ? [line1GapRatio, numberGapRatio]
        : [numberGapRatio, line1GapRatio];
  } else if (selection.numberPosition === "middle") {
    orderedNodes = [line1Node, numberNode, line2Node];
    orderedSizes = [line1FontSize, numberFontSize, line2FontSize];
    orderedGapRatios = [line1GapRatio, numberGapRatio, line2GapRatio];
  } else if (selection.numberPosition === "end") {
    orderedNodes = [line1Node, line2Node, numberNode];
    orderedSizes = [line1FontSize, line2FontSize, numberFontSize];
    orderedGapRatios = [line1GapRatio, line2GapRatio, numberGapRatio];
  } else {
    orderedNodes = [numberNode, line1Node, line2Node];
    orderedSizes = [numberFontSize, line1FontSize, line2FontSize];
    orderedGapRatios = [numberGapRatio, line1GapRatio, line2GapRatio];
  }

  const nodesWithSpacing = orderedNodes
    .map((node, index) =>
      node
        ? {
            node,
            marginTop:
              index === 0 ? 0 : orderedSizes[index - 1] * orderedGapRatios[index - 1],
          }
        : null
    )
    .filter(Boolean) as { node: JSX.Element; marginTop: number }[];

  useLayoutEffect(() => {
    const plate = plateRef.current;
    const text = textRef.current;
    if (!plate || !text) return;

    text.style.transform = "translateY(0px)";
    const plateRect = plate.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const plateCenterY = plateRect.top + plateRect.height / 2;
    const textCenterY = textRect.top + textRect.height / 2;
    const delta = plateCenterY - textCenterY;
    text.style.transform = `translateY(${delta}px)`;
  });

  // Positie (als verhouding 0–1) en straal van de schroefjes — zie
  // lib/configuration/plate-visual.ts (ook gebruikt voor de
  // voorbeeldafbeelding in de bevestigingsmail, zodat beide weergaves altijd
  // hetzelfde tonen).
  const screwPositions = getScrewPositions(isOval, plateWidth, plateHeight);
  const screwRadius = getScrewRadiusMm(plateWidth, plateHeight);

  return (
    <div className="lg:sticky lg:top-10">
      <p className="mb-3 text-center text-xs uppercase tracking-widest text-muted-foreground lg:text-left">
        Live preview
      </p>

      <div className="mx-auto w-full max-w-[260px]">
        <div
          ref={plateRef}
          className="relative flex flex-col items-center justify-center p-7 text-center shadow-[0_20px_35px_rgba(0,0,0,0.35)] transition-all duration-300"
          style={{
            aspectRatio: ratio,
            borderRadius: isOval ? "50%" : "12px",
            color: textColor,
          }}
        >
          {/* Het "geëmailleerde plaatje" zelf: achtergrond en de 4
              schroefjes, getekend als SVG — zodat het op elke maat en vorm
              (rechthoekig of ovaal) er als een echt bordje uitziet. Een
              sierrand/kaderlijn wordt alleen getekend als de klant de
              kaderoptie heeft aangevinkt (zie "opties"-stap,
              components/configurator/OptionsSelector.tsx) — tot 25-8-2026
              stond hier bewust nooit een kaderlijn (op eerder verzoek van
              Christiaan, 19-8-2026), maar dat is met deze nieuwe, optionele
              keuze achterhaald. */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${plateWidth} ${plateHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {isOval ? (
              <ellipse
                cx={plateWidth / 2}
                cy={plateHeight / 2}
                rx={plateWidth / 2}
                ry={plateHeight / 2}
                fill={plateFill}
              />
            ) : (
              <rect
                x={0}
                y={0}
                width={plateWidth}
                height={plateHeight}
                rx={plateWidth * 0.04}
                fill={plateFill}
              />
            )}

            {screwPositions.map(([xr, yr], index) => {
              const cx = plateWidth * xr;
              const cy = plateHeight * yr;
              return (
                <g key={index}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={screwRadius}
                    fill="#8f8f8f"
                    stroke="#4d4d4d"
                    strokeWidth={screwRadius * 0.14}
                  />
                  <circle cx={cx} cy={cy} r={screwRadius * 0.55} fill="#c9c9c9" />
                  <line
                    x1={cx - screwRadius * 0.4}
                    y1={cy}
                    x2={cx + screwRadius * 0.4}
                    y2={cy}
                    stroke="#4d4d4d"
                    strokeWidth={screwRadius * 0.18}
                    transform={`rotate(${(index * 37) % 90} ${cx} ${cy})`}
                  />
                </g>
              );
            })}

            {selection.hasFrame && (
              <path
                d={
                  isOval
                    ? getOvalFrameBorderPath(plateWidth, plateHeight)
                    : getFrameBorderPath(plateWidth, plateHeight)
                }
                fill="none"
                stroke={textColor}
                strokeWidth={
                  Math.min(plateWidth, plateHeight) * FRAME_STROKE_WIDTH_RATIO
                }
              />
            )}
          </svg>

          <div ref={textRef} className="relative z-10 flex w-full flex-col items-center">
            {nodesWithSpacing.map(({ node, marginTop }) => (
              <div key={node.key} style={{ marginTop: `${marginTop}px` }}>
                {node}
              </div>
            ))}
          </div>

          {isCurved && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                borderRadius: isOval ? "50%" : "12px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.35), transparent 45%)",
              }}
              aria-hidden="true"
            />
          )}
        </div>

        <dl className="mt-5 space-y-1.5 text-xs">
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <dt className="text-muted-foreground">Vorm</dt>
            <dd className="text-foreground">{shape?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <dt className="text-muted-foreground">Afwerking</dt>
            <dd className="capitalize text-foreground">{selection.finish ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <dt className="text-muted-foreground">Kleur</dt>
            <dd className="text-foreground">{color?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Maat</dt>
            <dd className="text-foreground">{size?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-1.5">
            <dt className="text-muted-foreground">Lettertype huisnummer</dt>
            <dd className="text-foreground">
              {productFonts.find((f) => f.id === selection.numberFontId)?.name ?? "—"}
            </dd>
          </div>
          {hasLine1 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lettertype tekstregel 1</dt>
              <dd className="text-foreground">
                {productFonts.find((f) => f.id === selection.line1FontId)?.name ?? "—"}
              </dd>
            </div>
          )}
          {hasLine2 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lettertype tekstregel 2</dt>
              <dd className="text-foreground">
                {productFonts.find((f) => f.id === selection.line2FontId)?.name ?? "—"}
              </dd>
            </div>
          )}
          {selection.hasFrame && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Kader</dt>
              <dd className="text-foreground">Ja</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-sm border border-border/60 bg-card px-4 py-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Totaalprijs
          </span>
          <span className="text-lg font-semibold text-foreground">
            {price ? formatPriceCents(price.totalCents) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
