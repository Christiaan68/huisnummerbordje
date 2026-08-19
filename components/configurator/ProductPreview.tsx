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

function getContrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#f7f5f0";
}

const PREVIEW_WIDTH_PX = 260;

// Positie van de "schroefjes", als verhouding (0 t/m 1) van de
// breedte/hoogte van het bordje.
// - Rechthoekig bordje: 4 schroefjes, één in elke hoek, op SCREW_INSET_RATIO
//   afstand van de rand.
// - Ovaal bordje: maar 2 schroefjes, aan de langste uiteinden van de ovaal
//   (dus op de langste as) — zo besloten door Christiaan op 19-8-2026,
//   in plaats van 4 schroefjes verspreid over de hele rand.
//   OVAL_SCREW_AXIS_RATIO bepaalt hoe ver naar de punten toe (0,5 zou
//   precies op de punt zelf zijn, wat niet kan: daar is de ovaal te smal
//   om het schroefje nog te laten passen).
const SCREW_INSET_RATIO = 0.11;
const OVAL_SCREW_AXIS_RATIO = 0.4;

// Placeholder-verhouding (breedte/hoogte) voor een ovaal bordje zolang er
// nog geen maat gekozen is — zonder dit zou de preview een perfecte cirkel
// tonen (breedte = hoogte) in plaats van een ovaal, wat verwarrend is
// (gemeld door Christiaan, 19-8-2026). 1,4 komt ongeveer overeen met de
// echte ovalen maten (van 150×105 tot 300×220 mm, allemaal rond de 1,35–1,43).
const DEFAULT_OVAL_RATIO = 1.4;

export function ProductPreview() {
  const { selection } = useConfigurator();
  const pricingData = usePricingData();
  const plateRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const color = productColors.find((c) => c.id === selection.colorId);
  const size = pricingData.productSizes.find((s) => s.id === selection.sizeId);
  const font = productFonts.find((f) => f.id === selection.fontId);
  const price = calculatePrice(selection, pricingData);

  const isOval = shape?.id === "ovaal";
  const ratio = size ? size.width / size.height : isOval ? DEFAULT_OVAL_RATIO : 1;
  const textColor = color ? getContrastTextColor(color.hex) : undefined;
  const fontFamily = font?.cssFamily ?? "var(--font-fraunces), Georgia, serif";

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
    const fit = computeAutoFit({
      widthMm: size.width,
      heightMm: size.height,
      numberChars: numberText.length,
      line1Chars: hasLine1 ? line1Text.length : null,
      line2Chars: hasLine2 ? line2Text.length : null,
    });
    const pxPerMm = PREVIEW_WIDTH_PX / size.width;
    numberFontSize = fit.numberSizeMm * pxPerMm;
    line1FontSize = fit.line1SizeMm ? fit.line1SizeMm * pxPerMm : line1FontSize;
    line2FontSize = fit.line2SizeMm ? fit.line2SizeMm * pxPerMm : line2FontSize;
  }

  const lineGapRatioByFont: Record<string, number> = {
    classic: 0.16,
    elegant: 0.16,
    modern: 0.06,
    industrial: 0.06,
  };
  const gapRatio = lineGapRatioByFont[font?.id ?? ""] ?? 0.08;

  // fontWeight: 700 (vet) op alle preview-tekst — zo lijkt de preview meer
  // op een echt geëmailleerd bordje, waar het nummer altijd dik/opvallend
  // gedrukt is (zie referentiefoto van Christiaan, 19-8-2026).
  const numberNode = (
    <span
      key="number"
      className="leading-none"
      style={{ fontFamily, fontSize: `${numberFontSize}px`, fontWeight: 700 }}
    >
      {numberText}
    </span>
  );
  const line1Node = hasLine1 ? (
    <span
      key="line1"
      className="leading-none"
      style={{ fontFamily, fontSize: `${line1FontSize}px`, fontWeight: 700 }}
    >
      {line1Text}
    </span>
  ) : null;
  const line2Node = hasLine2 ? (
    <span
      key="line2"
      className="leading-none"
      style={{ fontFamily, fontSize: `${line2FontSize}px`, fontWeight: 700 }}
    >
      {line2Text}
    </span>
  ) : null;

  const extraLineCount = (hasLine1 ? 1 : 0) + (hasLine2 ? 1 : 0);
  let orderedNodes: (JSX.Element | null)[];
  let orderedSizes: number[];
  if (extraLineCount === 0) {
    orderedNodes = [numberNode];
    orderedSizes = [numberFontSize];
  } else if (extraLineCount === 1) {
    orderedNodes = selection.numberPosition === "end" ? [line1Node, numberNode] : [numberNode, line1Node];
    orderedSizes =
      selection.numberPosition === "end"
        ? [line1FontSize, numberFontSize]
        : [numberFontSize, line1FontSize];
  } else if (selection.numberPosition === "middle") {
    orderedNodes = [line1Node, numberNode, line2Node];
    orderedSizes = [line1FontSize, numberFontSize, line2FontSize];
  } else if (selection.numberPosition === "end") {
    orderedNodes = [line1Node, line2Node, numberNode];
    orderedSizes = [line1FontSize, line2FontSize, numberFontSize];
  } else {
    orderedNodes = [numberNode, line1Node, line2Node];
    orderedSizes = [numberFontSize, line1FontSize, line2FontSize];
  }

  const nodesWithSpacing = orderedNodes
    .map((node, index) =>
      node
        ? { node, marginTop: index === 0 ? 0 : orderedSizes[index - 1] * gapRatio }
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

  // Positie (als verhouding 0–1) van de schroefjes. Rechthoekig bordje: 4
  // schroefjes, één in elke hoek. Ovaal bordje: 2 schroefjes, aan de
  // langste uiteinden (op de langste as — horizontaal als het bordje
  // breder is dan hoog, verticaal als het andersom is).
  const screwPositions = isOval
    ? plateWidth >= plateHeight
      ? [
          [0.5 - OVAL_SCREW_AXIS_RATIO, 0.5],
          [0.5 + OVAL_SCREW_AXIS_RATIO, 0.5],
        ]
      : [
          [0.5, 0.5 - OVAL_SCREW_AXIS_RATIO],
          [0.5, 0.5 + OVAL_SCREW_AXIS_RATIO],
        ]
    : [
        [SCREW_INSET_RATIO, SCREW_INSET_RATIO],
        [1 - SCREW_INSET_RATIO, SCREW_INSET_RATIO],
        [SCREW_INSET_RATIO, 1 - SCREW_INSET_RATIO],
        [1 - SCREW_INSET_RATIO, 1 - SCREW_INSET_RATIO],
      ];
  const screwRadius = Math.min(plateWidth, plateHeight) * 0.045;

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
              (rechthoekig of ovaal) er als een echt bordje uitziet.
              Bewust GEEN sierrand/kaderlijn (op verzoek van Christiaan,
              19-8-2026) — alleen de achtergrond en de schroefjes. */}
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
            <dt className="text-muted-foreground">Lettertype</dt>
            <dd className="text-foreground">{font?.name ?? "—"}</dd>
          </div>
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
