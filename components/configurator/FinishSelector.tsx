"use client";

import { Check } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import type { PlateFinish } from "@/types/product";
import { cn } from "@/lib/utils";

// Sinds deze afwerking-keuze een eigen configuratorstap is geworden (was
// eerst onderdeel van de "Vorm"-stap, met een voorbeeldfoto die pas
// verscheen bij hoveren/tikken), staan de twee voorbeeldfoto's hier gewoon
// altijd zichtbaar naast de keuze zelf — geen pop-up meer nodig.
//
// LET OP: de twee onderstaande bestanden moeten door Christiaan aangeleverd
// worden op deze paden in de map public/images/. Zolang dat nog niet is
// gebeurd, blijft het vak gewoon leeg/transparant (zelfde aanpak als bij de
// vormfoto's in ShapeSelector.tsx) — de keuze werkt dan nog gewoon, alleen
// zonder foto.
const FINISH_OPTIONS: {
  id: PlateFinish;
  label: string;
  description: string;
  imageSrc: string;
}[] = [
  {
    id: "vlak",
    label: "Vlak",
    description: "Een strak, plat emaille bordje.",
    imageSrc: "/images/afwerking-vlak.jpg",
  },
  {
    id: "gewelfd",
    label: "Gewelfd",
    description: "Een licht gebogen emaille bordje, met een klassieke uitstraling.",
    imageSrc: "/images/afwerking-gewelfd.jpg",
  },
];

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

  const options = FINISH_OPTIONS.filter((option) =>
    shape.availableFinishes.includes(option.id)
  );

  // Sommige vormen (bijvoorbeeld ovaal) zijn maar in één afwerking leverbaar
  // — dan is er niets te kiezen, alleen te tonen.
  if (options.length === 1) {
    const only = options[0];
    return (
      <div className="max-w-xs">
        <p className="mb-3 text-sm text-muted-foreground">
          Deze vorm is alleen leverbaar in{" "}
          <span className="font-medium text-foreground">{only.label}</span>.
        </p>
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          <div
            className="aspect-square w-full bg-secondary bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${encodeURI(only.imageSrc)}")` }}
            aria-hidden="true"
          />
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-foreground">{only.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {only.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Kies een afwerking"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {options.map((option) => {
        const isSelected = selection.finish === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => dispatch({ type: "SET_FINISH", finish: option.id })}
            className={cn(
              // ring-inset (i.p.v. de gewone, naar buiten uitstekende ring):
              // anders werd het geselecteerde vakje net iets groter dan het
              // niet-geselecteerde, waardoor de twee vakjes leken te
              // "verspringen" bij het wisselen van keuze (gemeld door
              // Christiaan, 20-8-2026). Met ring-inset blijft de buitenmaat
              // van beide vakjes altijd exact gelijk.
              "flex flex-col overflow-hidden rounded-sm border bg-card text-left transition-colors",
              // De min-h-[2rem] hieronder op de omschrijving (zie verderop)
              // hoort ook bij deze fix: de omschrijving van "Gewelfd" is
              // langer dan die van "Vlak" en wikkelde daardoor naar 2 regels
              // i.p.v. 1, waardoor het vakje van "Vlak" lager/kleiner leek
              // (gemeld door Christiaan, 25-8-2026). Door altijd ruimte voor
              // 2 regels te reserveren, blijven beide vakjes ook bij
              // toekomstige tekstwijzigingen even hoog.
              isSelected
                ? "border-primary ring-1 ring-inset ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <div
              className="aspect-square w-full bg-secondary bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${encodeURI(option.imageSrc)}")` }}
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 px-4 py-3">
              {isSelected && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </p>
                <p className="mt-0.5 min-h-[2rem] text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
