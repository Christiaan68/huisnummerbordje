"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import {
  productShapes,
  productColors,
  productSizes,
  productFonts,
} from "@/config/product-options";
import { computeAutoFit } from "@/lib/configuration/text-fit";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ConfigurationSummary() {
  const { selection } = useConfigurator();

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const color = productColors.find((c) => c.id === selection.colorId);
  const size = productSizes.find((s) => s.id === selection.sizeId);
  const font = productFonts.find((f) => f.id === selection.fontId);

  const price =
    size && selection.finish === "vlak"
      ? size.priceFlatCents
      : size?.priceCurvedCents;

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;

  const autoFit =
    size && selection.customText
      ? computeAutoFit({
          widthMm: size.width,
          heightMm: size.height,
          numberChars: selection.customText.length,
          line1Chars: hasLine1 ? selection.extraLine1.length || null : null,
          line2Chars: hasLine2 ? selection.extraLine2.length || null : null,
        })
      : null;

  return (
    <dl>
      <Row label="Vorm" value={shape?.name ?? "—"} />
      <Row
        label="Afwerking"
        value={selection.finish === "vlak" ? "Vlak" : "Gewelfd"}
      />
      <Row label="Kleur" value={color?.name ?? "—"} />
      <Row label="Maat" value={size?.name ?? "—"} />
      <Row label="Huisnummer" value={selection.customText || "—"} />
      {hasLine1 && (
        <Row label="Tekstregel 1" value={selection.extraLine1 || "—"} />
      )}
      {hasLine2 && (
        <Row label="Tekstregel 2" value={selection.extraLine2 || "—"} />
      )}
      <Row
        label="Tekengrootte (automatisch)"
        value={
          autoFit
            ? [
                `${autoFit.numberSizeMm} mm`,
                autoFit.line1SizeMm ? `${autoFit.line1SizeMm} mm` : null,
                autoFit.line2SizeMm ? `${autoFit.line2SizeMm} mm` : null,
              ]
                .filter(Boolean)
                .join(" / ")
            : "—"
        }
      />
      <Row label="Lettertype" value={font?.name ?? "—"} />
      <Row
        label="Prijs"
        value={
          price !== null && price !== undefined
            ? `€ ${(price / 100).toFixed(2).replace(".", ",")}`
            : "Prijs op aanvraag"
        }
      />
    </dl>
  );
}