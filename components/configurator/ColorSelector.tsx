"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import { productShapes, productColors } from "@/config/product-options";
import { getEarsColorOptions, isEarsShape } from "@/lib/configuration/shape-helpers";
import { formatPriceCents } from "@/lib/configuration/pricing";
import type { ProductColor } from "@/types/product";
import { cn } from "@/lib/utils";

/**
 * Eén rij aanklikbare kleurkaarten — de bestaande opbouw/stijl van de
 * enkelvoudige kleurkeuze (colorMode "single"), nu ook hergebruikt voor de
 * twee losse kleurkeuzes van de "oren"-vormen (colorMode "ears-and-plate",
 * zie ColorSelector hieronder). Puur presentatie/interactie — welke
 * kleurenlijst, welke standaardkleuren en welke actie er bij een klik
 * gedispatcht wordt, bepaalt de caller.
 */
function ColorOptionGrid({
  colors,
  selectedId,
  standardColorIds,
  colorSurchargeCents,
  ariaLabel,
  onSelect,
}: {
  colors: ProductColor[];
  selectedId: string | null;
  standardColorIds: string[];
  colorSurchargeCents: number;
  ariaLabel: string;
  onSelect: (colorId: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-3 gap-4 sm:grid-cols-6"
    >
      {colors.map((color) => {
        const isSelected = selectedId === color.id;
        const isStandardColor = standardColorIds.includes(color.id);

        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(color.id)}
            className="flex flex-col items-center gap-2"
          >
            <span
              className={cn(
                "h-16 w-16 rounded-full border-2 shadow-sm transition-transform sm:h-20 sm:w-20",
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "border-border/60 hover:scale-105"
              )}
              style={{ backgroundColor: color.hex }}
            />
            <span className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1.5">
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {color.name}
                </span>
              </span>
              {color.ralCode && (
                <span className="text-[11px] text-muted-foreground">
                  ({color.ralCode})
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {isStandardColor
                  ? "Standaardprijs"
                  : `Meerprijs +${formatPriceCents(colorSurchargeCents)}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorSelector() {
  const { selection, dispatch } = useConfigurator();
  const { globalPricingOptions } = usePricingData();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (isEarsShape(shape)) {
    // "Ears-and-plate" (nieuw 9-9-2026): 2 losse, allebei verplichte
    // kleurkeuzes uit dezelfde kleurenlijst (productColorsOren) — zie
    // ColorOptionGrid hierboven voor de gedeelde opbouw/stijl en
    // types/configuration.ts / config/product-options.ts voor de achtergrond.
    // Bewust GEEN vooraf geselecteerde kleur: `selection.earColorId`/
    // `plateColorId` starten op `null` (zie emptyConfiguratorSelection en de
    // SET_SHAPE-reducer in ConfiguratorContext.tsx), de klant moet dus zelf
    // bewust op een kleur klikken.
    //
    // Hernoemd/heringedeeld 16-9-2026 (op verzoek van Christiaan): eerst
    // `plateColorId` als "Ondergrond kleur" (bepaalt de achtergrond van het
    // middenvlak in de preview), dan `earColorId` als "Opdruk kleur" (geldt
    // in de preview voor zowel de oren als het huisnummer, zie
    // ProductPreview.tsx) — dezelfde volgorde/indeling als bij de
    // colorMode "single"-vormen hieronder. De veldnamen/acties zelf
    // (earColorId/plateColorId, SET_EAR_COLOR/SET_PLATE_COLOR) zijn
    // ongewijzigd, alleen de volgorde en de zichtbare labels zijn omgedraaid.
    const earsColors = getEarsColorOptions();

    return (
      <div className="space-y-8">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Ondergrond kleur
          </p>
          <ColorOptionGrid
            colors={earsColors}
            selectedId={selection.plateColorId}
            standardColorIds={globalPricingOptions.orenStandardColorIds}
            colorSurchargeCents={globalPricingOptions.colorSurchargeCents}
            ariaLabel="Kies een ondergrondkleur"
            onSelect={(colorId) => dispatch({ type: "SET_PLATE_COLOR", colorId })}
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Opdruk kleur
          </p>
          <ColorOptionGrid
            colors={earsColors}
            selectedId={selection.earColorId}
            standardColorIds={globalPricingOptions.orenStandardColorIds}
            colorSurchargeCents={globalPricingOptions.colorSurchargeCents}
            ariaLabel="Kies een opdrukkleur"
            onSelect={(colorId) => dispatch({ type: "SET_EAR_COLOR", colorId })}
          />
        </div>
      </div>
    );
  }

  // colorMode "single" — de 4 oorspronkelijke vormen + het ovale model.
  // Sinds 16-9-2026 (op verzoek van Christiaan) TWEE kleurkeuzes i.p.v. één:
  // eerst "Ondergrond kleur" (colorId, bestaand veld, bepaalt de
  // achtergrond), dan "Opdruk kleur" (nieuw: printColorId, bepaalt in de
  // preview het huisnummer en eventuele tekstregels) — allebei uit dezelfde
  // kleurenlijst/standaardkleuren (productColors/standardColorIds). Zie
  // ProductPreview.tsx voor hoe de twee kleuren toegepast worden en
  // lib/configuration/pricing.ts voor de (per kleur losse) meerprijs.
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Ondergrond kleur
        </p>
        <ColorOptionGrid
          colors={productColors}
          selectedId={selection.colorId}
          standardColorIds={globalPricingOptions.standardColorIds}
          colorSurchargeCents={globalPricingOptions.colorSurchargeCents}
          ariaLabel="Kies een ondergrondkleur"
          onSelect={(colorId) => dispatch({ type: "SET_COLOR", colorId })}
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Opdruk kleur
        </p>
        <ColorOptionGrid
          colors={productColors}
          selectedId={selection.printColorId}
          standardColorIds={globalPricingOptions.standardColorIds}
          colorSurchargeCents={globalPricingOptions.colorSurchargeCents}
          ariaLabel="Kies een opdrukkleur"
          onSelect={(colorId) => dispatch({ type: "SET_PRINT_COLOR", colorId })}
        />
      </div>
    </div>
  );
}
