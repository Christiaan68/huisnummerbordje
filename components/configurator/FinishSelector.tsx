"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import type { PlateFinish } from "@/types/product";
import { cn } from "@/lib/utils";

const finishLabels: Record<PlateFinish, string> = {
  vlak: "Vlak",
  gewelfd: "Gewelfd",
};

export function FinishSelector() {
  const { selection, dispatch } = useConfigurator();

  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (!shape) {
    return (
      <p className="text-sm text-muted-foreground">
        Kies eerst een vorm om de afwerking te selecteren.
      </p>
    );
  }

  if (shape.availableFinishes.length === 1) {
    return (
      <p className="text-sm text-muted-foreground">
        Deze vorm is alleen leverbaar in{" "}
        <span className="font-medium text-foreground">
          {finishLabels[shape.availableFinishes[0]]}
        </span>
        .
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Kies een afwerking" className="flex gap-3">
      {shape.availableFinishes.map((finish) => {
        const isSelected = selection.finish === finish;

        return (
          <button
            key={finish}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_FINISH", finish })}
            className={cn(
              "flex items-center gap-2 rounded-sm border px-5 py-3 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {isSelected && <Check className="h-4 w-4 text-primary" />}
            {finishLabels[finish]}
          </button>
        );
      })}
    </div>
  );
}
