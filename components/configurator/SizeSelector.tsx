"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import { productShapes } from "@/config/product-options";
import { configuratorSteps, getVisibleSteps } from "@/lib/configuration/steps";
import { cn } from "@/lib/utils";

function formatPrice(cents: number | null): string {
  if (cents === null) return "Prijs volgt";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function SizeSelector() {
  const router = useRouter();
  const { selection, dispatch } = useConfigurator();
  const { productSizes } = usePricingData();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  const sizes = productSizes.filter(
    (size) => size.shapeId === selection.shapeId && size.active
  );

  // Vormen zonder maatkeuze (hasSizeChoice: false — de 3 "oren"-vormen,
  // nieuw 9-9-2026) hebben precies 1 vaste maat, al automatisch gezet door
  // ConfiguratorContext.tsx, en slaan deze stap al over in de normale
  // klik-door-navigatie (zie lib/configuration/steps.ts, getVisibleSteps).
  // Deze guard vangt alleen rechtstreekse navigatie naar deze URL bij zo'n
  // vorm op, zodat er nooit een (voor die vorm zinloze) maatkeuze getoond
  // wordt — de klant wordt meteen doorgestuurd naar de eerstvolgende stap
  // die voor zijn vorm wél van toepassing is.
  const skipThisStep = Boolean(shape && !shape.hasSizeChoice);

  useEffect(() => {
    if (!skipThisStep) return;
    const ownIndex = configuratorSteps.findIndex((s) => s.id === "maat");
    const nextStep = getVisibleSteps(selection).find(
      (s) => configuratorSteps.findIndex((cs) => cs.id === s.id) > ownIndex
    );
    router.replace(nextStep?.path ?? "/configurator/controle");
  }, [skipThisStep, selection, router]);

  if (skipThisStep) {
    return (
      <p className="text-sm text-muted-foreground">
        Deze vorm heeft geen maatkeuze. Je wordt doorgestuurd naar de
        volgende stap...
      </p>
    );
  }

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
