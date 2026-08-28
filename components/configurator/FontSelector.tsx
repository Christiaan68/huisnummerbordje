"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productFonts } from "@/config/product-options";
import { cn } from "@/lib/utils";

export function FontSelector() {
  const { selection, dispatch } = useConfigurator();

  return (
    <div
      role="radiogroup"
      aria-label="Kies een lettertype"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {productFonts.map((font) => {
        const isSelected = selection.fontId === font.id;

        return (
          <button
            key={font.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_FONT", fontId: font.id })}
            className={cn(
              "flex items-center justify-between rounded-sm border bg-card px-5 py-5 text-left transition-colors",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <div>
              <p
                className="text-2xl text-foreground"
                style={{ fontFamily: font.cssFamily }}
              >
                {font.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {font.name.toLowerCase()}
              </p>
            </div>
            {isSelected && <Check className="h-5 w-5 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
