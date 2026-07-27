"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import {
  productShapes,
  productColors,
  productSizes,
  productFonts,
} from "@/config/product-options";

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
      {shape && shape.extraLines >= 1 && (
        <Row label="Tekstregel 1" value={selection.extraLine1 || "—"} />
      )}
      {shape && shape.extraLines >= 2 && (
        <Row label="Tekstregel 2" value={selection.extraLine2 || "—"} />
      )}
      <Row
        label="Tekengrootte"
        value={
          [
            selection.numberSizeMm ? `${selection.numberSizeMm} mm` : null,
            shape && shape.extraLines >= 1 && selection.line1SizeMm
              ? `${selection.line1SizeMm} mm`
              : null,
            shape && shape.extraLines >= 2 && selection.line2SizeMm
              ? `${selection.line2SizeMm} mm`
              : null,
          ]
            .filter(Boolean)
            .join(" / ") || "—"
        }
      />
      <Row label="Lettertype" value={font?.name ?? "—"} />
      <Row
        label="Prijs"
        value={price !== null && price !== undefined
          ? `€ ${(price / 100).toFixed(2).replace(".", ",")}`
          : "Prijs op aanvraag"}
      />
    </dl>
  );
}
