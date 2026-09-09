"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import { productShapes } from "@/config/product-options";
import { configuratorSteps, getVisibleSteps } from "@/lib/configuration/steps";
import { formatPriceCents } from "@/lib/configuration/pricing";
import { cn } from "@/lib/utils";

// De kaderoptie (toegevoegd 25-8-2026, n.a.v. voorbeeldfoto van Christiaan;
// sinds 28-8-2026 ook beschikbaar voor de ovale vorm, zie
// lib/configuration/plate-visual.ts / getOvalFrameBorderPath) is een
// eenvoudige aan/uit-keuze (geen keuze tussen meerdere varianten, zoals bij
// Vorm of Afwerking) — daarom hier één aanklikbaar vakje in plaats van een
// groep van meerdere kaarten. Er is geen aparte voorbeeldfoto voor het
// ovale kader, dus wordt dezelfde thumbnail hergebruikt als bij de andere
// vormen.
const FRAME_IMAGE_SRC = "/images/optie-kader.jpg";

export function OptionsSelector() {
  const router = useRouter();
  const { selection, dispatch } = useConfigurator();
  const pricingData = usePricingData();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  const frameSurchargeCents = pricingData.globalPricingOptions.frameSurchargeCents;

  const isSelected = selection.hasFrame;

  // Vormen zonder kaderoptie (hasFrameChoice: false — de 3 "oren"-vormen,
  // nieuw 9-9-2026) slaan deze stap al over in de normale klik-door-
  // navigatie (zie lib/configuration/steps.ts, getVisibleSteps). Deze guard
  // vangt alleen rechtstreekse navigatie naar deze URL bij zo'n vorm op
  // (bv. "/configurator/opties" handmatig intypen), zodat de klant nooit
  // een (voor die vorm zinloze) kaderkeuze te zien krijgt — hij wordt
  // meteen doorgestuurd naar de eerstvolgende stap die voor zijn vorm wél
  // van toepassing is.
  const skipThisStep = Boolean(shape && !shape.hasFrameChoice);

  useEffect(() => {
    if (!skipThisStep) return;
    const ownIndex = configuratorSteps.findIndex((s) => s.id === "opties");
    const nextStep = getVisibleSteps(selection).find(
      (s) => configuratorSteps.findIndex((cs) => cs.id === s.id) > ownIndex
    );
    router.replace(nextStep?.path ?? "/configurator/controle");
  }, [skipThisStep, selection, router]);

  if (skipThisStep) {
    return (
      <p className="text-sm text-muted-foreground">
        Deze vorm heeft geen kaderoptie. Je wordt doorgestuurd naar de
        volgende stap...
      </p>
    );
  }

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
