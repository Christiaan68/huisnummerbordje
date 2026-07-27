"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productSizes } from "@/config/product-options";
import { cn } from "@/lib/utils";

function formatPrice(cents: number | null): string {
  if (cents === null) return "Prijs volgt";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function SizeSelector() {
  const { selection, dispatch } = useConfigurator();

  const sizes = productSizes.filter(
    (size) => size.shapeId === selection.shapeId && size.active
  );

  if (!selection.shapeId) {
    return (
      <p className="text-sm text-muted-foreground">
        Kies eerst een vorm bij stap 1, dan tonen we hier de bijpassende
        maten.
      </p>
    );
  }

  const relevantPrice = (size: (typeof sizes)[number]) =>
    selection.finish === "vlak" ? size.priceFlatCents : size.priceCurvedCents;

  return (
    <div
      role="radiogroup"
      aria-label="Kies een maat"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {sizes.map((size) => {
        const isSelected = selection.sizeId === size.id;

        return (
          <button
            key={size.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_SIZE", sizeId: size.id })}
            className={cn(
              "flex items-center justify-between rounded-sm border bg-card px-5 py-4 text-left transition-colors",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="flex items-center gap-2">
              {isSelected && <Check className="h-4 w-4 text-primary" />}
              <span className="font-medium text-foreground">{size.name}</span>
            </span>
            <span className="text-sm text-muted-foreground">
              {formatPrice(relevantPrice(size))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
