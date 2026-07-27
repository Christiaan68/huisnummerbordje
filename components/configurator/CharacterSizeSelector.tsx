"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { characterSizes } from "@/config/product-options";
import { cn } from "@/lib/utils";

export function CharacterSizeSelector() {
  const { selection, dispatch } = useConfigurator();

  return (
    <div
      role="radiogroup"
      aria-label="Kies een tekengrootte"
      className="grid grid-cols-3 gap-3"
    >
      {characterSizes.map((size) => {
        const isSelected = selection.characterSizeId === size.id;

        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() =>
              dispatch({ type: "SET_CHARACTER_SIZE", characterSizeId: size.id })
            }
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-sm border bg-card px-4 py-3 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary ring-1 ring-primary text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            {size.label}
          </button>
        );
      })}
    </div>
  );
}