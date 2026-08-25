"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import { cn } from "@/lib/utils";

export function ShapeSelector() {
  const { selection, dispatch } = useConfigurator();

  return (
    <div
      role="radiogroup"
      aria-label="Kies een vorm"
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {productShapes.map((shape) => {
        const isSelected = selection.shapeId === shape.id;

        return (
          <button
            key={shape.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_SHAPE", shapeId: shape.id })}
            className={cn(
              "flex flex-col items-center gap-3 rounded-sm border bg-card px-3 py-4 text-left transition-colors",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            {/* Productfoto — door de eigenaar aan te leveren op het pad
                hieronder. Zonder foto blijft dit vlak leeg/transparant,
                de kaart blijft dan gewoon bruikbaar.
                bg-contain (i.p.v. bg-cover) zodat het hele voorbeeldbordje
                op de foto altijd volledig te zien is, in plaats van dat de
                randen worden bijgesneden (gemeld door Christiaan, 25-8-2026,
                zelfde aanpak als bij de afwerkingsfoto's in
                FinishSelector.tsx). */}
            <div
              className="h-24 w-full rounded-sm bg-secondary bg-contain bg-center bg-no-repeat sm:h-28"
              style={{
                backgroundImage: `url("${encodeURI(shape.imageSrc)}")`,
              }}
              aria-hidden="true"
            />
            <div>
              <p
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {shape.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shape.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
