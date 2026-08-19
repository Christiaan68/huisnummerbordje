"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import { productColors } from "@/config/product-options";
import { formatPriceCents } from "@/lib/configuration/pricing";
import { cn } from "@/lib/utils";

export function ColorSelector() {
  const { selection, dispatch } = useConfigurator();
  const { globalPricingOptions } = usePricingData();

  return (
    <div
      role="radiogroup"
      aria-label="Kies een kleur"
      className="grid grid-cols-3 gap-4 sm:grid-cols-6"
    >
      {productColors.map((color) => {
        const isSelected = selection.colorId === color.id;
        const isStandardColor = globalPricingOptions.standardColorIds.includes(
          color.id
        );

        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_COLOR", colorId: color.id })}
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
                  : `Meerprijs +${formatPriceCents(globalPricingOptions.colorSurchargeCents)}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
