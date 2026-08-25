"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";
import { calculatePrice, formatPriceCents } from "@/lib/configuration/pricing";

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
  const pricingData = usePricingData();

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const color = productColors.find((c) => c.id === selection.colorId);
  const size = pricingData.productSizes.find((s) => s.id === selection.sizeId);
  const font = productFonts.find((f) => f.id === selection.fontId);
  const price = calculatePrice(selection, pricingData);

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;

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
      <Row label="Lettertype" value={font?.name ?? "—"} />
      {selection.hasFrame && <Row label="Kader" value="Ja" />}
      {price && price.colorSurchargeCents > 0 && (
        <Row
          label="Meerprijs kleur"
          value={formatPriceCents(price.colorSurchargeCents)}
        />
      )}
      {price && price.extraCharsCents > 0 && (
        <Row
          label={`Meerprijs extra tekens (${price.extraCharsCount}×)`}
          value={formatPriceCents(price.extraCharsCents)}
        />
      )}
      {price && price.frameSurchargeCents > 0 && (
        <Row
          label="Meerprijs kader"
          value={formatPriceCents(price.frameSurchargeCents)}
        />
      )}
      <Row
        label="Totaalprijs"
        value={price ? formatPriceCents(price.totalCents) : "Prijs op aanvraag"}
      />
    </dl>
  );
}
