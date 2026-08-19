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
import { cn } from "@/lib/utils";

function getContrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#f7f5f0";
}

const PREVIEW_WIDTH_PX = 260;

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
  const ratio = size ? size.width / size.height : 1;
  const textColor = color ? getContrastTextColor(color.hex) : undefined;
  const fontFamily = font?.cssFamily ?? "var(--font-fraunces), Georgia, serif";

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;
  const isCurved = selection.finish !== "vlak";

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

  const numberNode = (
    <span key="number" className="leading-none" style={{ fontFamily, fontSize: `${numberFontSize}px` }}>
      {numberText}
    </span>
  );
  const line1Node = hasLine1 ? (
    <span key="line1" className="leading-none" style={{ fontFamily, fontSize: `${line1FontSize}px` }}>
      {line1Text}
    </span>
  ) : null;
  const line2Node = hasLine2 ? (
    <span key="line2" className="leading-none" style={{ fontFamily, fontSize: `${line2FontSize}px` }}>
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

  return (
    <div className="lg:sticky lg:top-10">
      <p className="mb-3 text-center text-xs uppercase tracking-widest text-muted-foreground lg:text-left">
        Live preview
      </p>

      <div className="mx-auto w-full max-w-[260px]">
        <div
          ref={plateRef}
          className={cn(
            "relative flex flex-col items-center justify-center border-[6px] p-6 text-center shadow-[0_20px_35px_rgba(0,0,0,0.35)] transition-all duration-300",
            !color && "bg-secondary"
          )}
          style={{
            aspectRatio: ratio,
            backgroundColor: color?.hex,
            borderColor: "hsl(var(--primary))",
            borderRadius: isOval ? "50%" : "12px",
            color: textColor,
          }}
        >
          <div ref={textRef} className="flex w-full flex-col items-center">
            {nodesWithSpacing.map(({ node, marginTop }) => (
              <div key={node.key} style={{ marginTop: `${marginTop}px` }}>
                {node}
              </div>
            ))}
          </div>

          {isCurved && (
            <div
              className="pointer-events-none absolute inset-0"
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
