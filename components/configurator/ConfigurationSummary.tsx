"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";
import { getEarsColorOptions, isEarsShape } from "@/lib/configuration/shape-helpers";
import { calculatePrice, formatPriceCents } from "@/lib/configuration/pricing";
import { buildOrderLabel } from "@/lib/configuration/orderLabel";

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
  const earsShape = isEarsShape(shape);
  const size = pricingData.productSizes.find((s) => s.id === selection.sizeId);
  const price = calculatePrice(selection, pricingData);

  const orderLabel = shape ? buildOrderLabel(shape, selection.numberPosition) : undefined;

  if (earsShape) {
    // "Oren"-vormen (colorMode "ears-and-plate", nieuw 9-9-2026): vaste
    // maat, 2 losse kleuren (oren + vlak) i.p.v. 1, geen afwerking-,
    // lettertype- of kaderregel — die keuzes bestaan voor deze vormen niet
    // (zie types/product.ts, capability-vlaggen).
    const earsColors = getEarsColorOptions();
    const earColor = earsColors.find((c) => c.id === selection.earColorId);
    const plateColor = earsColors.find((c) => c.id === selection.plateColorId);

    return (
      <dl>
        <Row label="Vorm" value={shape?.name ?? "—"} />
        <Row label="Maat" value={size?.name ?? "—"} />
        <Row label="Kleur oren" value={earColor?.name ?? "—"} />
        <Row label="Kleur vlak" value={plateColor?.name ?? "—"} />
        <Row label="Huisnummer" value={selection.customText || "—"} />
        {orderLabel && <Row label="Volgorde" value={orderLabel} />}
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
        <Row
          label="Totaalprijs"
          value={price ? formatPriceCents(price.totalCents) : "Prijs op aanvraag"}
        />
      </dl>
    );
  }

  // colorMode "single" — de 4 oorspronkelijke vormen. Ongewijzigd gedrag.
  const color = productColors.find((c) => c.id === selection.colorId);
  const numberFont = productFonts.find((f) => f.id === selection.numberFontId);
  const line1Font = productFonts.find((f) => f.id === selection.line1FontId);
  const line2Font = productFonts.find((f) => f.id === selection.line2FontId);

  const hasLine1 = (shape?.extraLines ?? 0) >= 1;
  const hasLine2 = (shape?.extraLines ?? 0) >= 2;

  return (
    <dl>
      <Row label="Vorm" value={shape?.name ?? "—"} />
      <Row
        label="Afwerking"
        value={
          selection.finish === "vlak"
            ? "Vlak"
            : selection.finish === "gewelfd"
              ? "Gewelfd"
              : "—"
        }
      />
      <Row label="Kleur" value={color?.name ?? "—"} />
      <Row label="Maat" value={size?.name ?? "—"} />
      <Row label="Huisnummer" value={selection.customText || "—"} />
      <Row label="Lettertype huisnummer" value={numberFont?.name ?? "—"} />
      {hasLine1 && (
        <>
          <Row label="Tekstregel 1" value={selection.extraLine1 || "—"} />
          <Row label="Lettertype tekstregel 1" value={line1Font?.name ?? "—"} />
        </>
      )}
      {hasLine2 && (
        <>
          <Row label="Tekstregel 2" value={selection.extraLine2 || "—"} />
          <Row label="Lettertype tekstregel 2" value={line2Font?.name ?? "—"} />
        </>
      )}
      {orderLabel && <Row label="Volgorde" value={orderLabel} />}
      <Row
        label="Kader"
        value={
          selection.hasFrame
            ? `Ja – ${
                price ? formatPriceCents(price.frameSurchargeCents) : "prijs op aanvraag"
              }`
            : "Nee"
        }
      />
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
      <Row
        label="Totaalprijs"
        value={price ? formatPriceCents(price.totalCents) : "Prijs op aanvraag"}
      />
    </dl>
  );
}
