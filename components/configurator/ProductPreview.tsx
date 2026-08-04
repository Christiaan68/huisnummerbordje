"use client";

import { useLayoutEffect, useRef } from "react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import {
  productShapes,
  productColors,
  productFonts,
  productSizes,
} from "@/config/product-options";
import { cn } from "@/lib/utils";

function getContrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#f7f5f0";
}

export function ProductPreview() {
  const { selection } = useConfigurator();
  const plateRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const color = productColors.find((c) => c.id === selection.colorId);
  const size = productSizes.find((s) => s.id === selection.sizeId);
  const font = productFonts.find((f) => f.id === selection.fontId);

  const isOval = shape?.id === "ovaal";
  const ratio = size ? size.width / size.height : 1;
  const textColor = color ? getContrastTextColor(color.hex) : undefined;
  const fontFamily = font?.cssFamily ?? "var(--font-fraunces), Georgia, serif";
  const toPreviewSize = (mm: number | null, fallback: number, scale: number) =>
    mm ? mm * scale : fallback;
  const numberFontSize = toPreviewSize(selection.numberSizeMm, 34, 0.5);
  const line1FontSize = toPreviewSize(selection.line1SizeMm, 14, 0.35);
  const line2FontSize = toPreviewSize(selection.line2SizeMm, 14, 0.35);

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;
  const isCurved = selection.finish !== "vlak";

  const numberNode = (
    <span key="number" className="leading-none" style={{ fontFamily, fontSize: `${numberFontSize}px` }}>
      {selection.customText || "12"}
    </span>
  );
  const line1Node = hasLine1 ? (
    <span key="line1" className="leading-none" style={{ fontFamily, fontSize: `${line1FontSize}px` }}>
      {selection.extraLine1 || "Voorbeeldtekst"}
    </span>
  ) : null;
  const line2Node = hasLine2 ? (
    <span key="line2" className="leading-none" style={{ fontFamily, fontSize: `${line2FontSize}px` }}>
      {selection.extraLine2 || "Voorbeeldtekst"}
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
    orderedSizes = selection.numberPosition === "end" ? [line1FontSize, numberFontSize] : [numberFontSize, line1FontSize];
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

  const opticalCorrection = 0;

  useLayoutEffect(() => {
    const plate = plateRef.current;
    const text = textRef.current;
    if (!plate || !text) return;

    text.style.transform = "translateY(0px)";
    const plateRect = plate.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const plateCenterY = plateRect.top + plateRect.height / 2;
    const textCenterY = textRect.top + textRect.height / 2;
    const delta = plateCenterY - textCenterY - opticalCorrection;
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
          <div ref={textRef} className="flex w-full flex-col items-center gap-2">
            {orderedNodes.filter(Boolean)}
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
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <dt className="text-muted-foreground">Maat</dt>
            <dd className="text-foreground">{size?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <dt className="text-muted-foreground">Tekengrootte</dt>
            <dd className="text-foreground">
              {selection.numberSizeMm ? `${selection.numberSizeMm} mm` : "—"}
              {hasLine1 && selection.line1SizeMm && ` / ${selection.line1SizeMm} mm`}
              {hasLine2 && selection.line2SizeMm && ` / ${selection.line2SizeMm} mm`}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Lettertype</dt>
            <dd className="text-foreground">{font?.name ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}