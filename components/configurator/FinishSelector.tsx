"use client";

import { useState } from "react";
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
  // Voor de pop-up met het voorbeeldfotootje: welke afwerking (vlak/gewelfd)
  // wordt op dit moment aangewezen/gefocust? null = geen pop-up tonen.
  const [previewFinish, setPreviewFinish] = useState<PlateFinish | null>(null);

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
    <div className="relative">
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
              onMouseEnter={() => setPreviewFinish(finish)}
              onMouseLeave={() => setPreviewFinish(null)}
              onFocus={() => setPreviewFinish(finish)}
              onBlur={() => setPreviewFinish(null)}
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

      {/* Pop-up met een voorbeeldfoto van het verschil tussen vlak en
          gewelfd emaille, zichtbaar zodra je met je muis over (of met het
          toetsenbord naar) een van beide knoppen gaat. Dezelfde foto laat
          meteen beide afwerkingen naast elkaar zien, dus die tonen we bij
          allebei de knoppen. */}
      {previewFinish && (
        <div
          className="absolute left-0 top-full z-20 mt-3 w-72 rounded-sm border border-border bg-card p-2 shadow-lg sm:w-96"
          role="tooltip"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/vlak-vs-gewelfd.jpg"
            alt="Voorbeeld van een huisnummerbordje in vlak emaille naast een huisnummerbordje in gewelfd emaille"
            className="w-full rounded-sm"
          />
        </div>
      )}
    </div>
  );
}
