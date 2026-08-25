"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import { productShapes } from "@/config/product-options";
import { formatPriceCents } from "@/lib/configuration/pricing";
import { cn } from "@/lib/utils";

// De kaderoptie (toegevoegd 25-8-2026, n.a.v. voorbeeldfoto van Christiaan)
// is een eenvoudige aan/uit-keuze (geen keuze tussen meerdere varianten,
// zoals bij Vorm of Afwerking) — daarom hier één aanklikbaar vakje in
// plaats van een groep van meerdere kaarten. Alleen beschikbaar voor
// niet-ovale vormen (besloten door Christiaan, 25-8-2026): bij "ovaal"
// wordt dit gewoon een toelichtende tekst, net als bij FinishSelector.tsx
// wanneer een vorm maar in één afwerking leverbaar is.
const FRAME_IMAGE_SRC = "/images/optie-kader.jpg";

export function OptionsSelector() {
  const { selection, dispatch } = useConfigurator();
  const pricingData = usePricingData();
  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const isOval = shape?.id === "ovaal";

  const frameSurchargeCents = pricingData.globalPricingOptions.frameSurchargeCents;

  if (isOval) {
    return (
      <p className="text-sm text-muted-foreground">
        Voor een ovaal bordje is geen kaderrand beschikbaar.
      </p>
    );
  }

  const isSelected = selection.hasFrame;

  return (
    <div className="max-w-xs">
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        onClick={() =>
          dispatch({ type: "SET_HAS_FRAME", hasFrame: !isSelected })
        }
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-sm border bg-card text-left transition-colors",
          isSelected
            ? "border-primary ring-1 ring-inset ring-primary"
            : "border-border hover:border-primary/50"
        )}
      >
        <div
          className="aspect-square w-full bg-secondary bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${encodeURI(FRAME_IMAGE_SRC)}")` }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2 px-4 py-3">
          {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
          <div>
            <p
              className={cn(
                "text-sm font-medium",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Kaderrand
            </p>
            <p className="mt-0.5 min-h-[2rem] text-xs text-muted-foreground">
              Een sierlijke rand langs de rand van het bordje.
            </p>
            <p className="mt-1 text-xs font-medium text-foreground">
              + {formatPriceCents(frameSurchargeCents)}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
