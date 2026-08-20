"use client";

import { useEffect, useState } from "react";
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
  // Voor de pop-up met het voorbeeldfotootje: sta je (met muis of
  // toetsenbord) ergens boven de knoppen óf boven de pop-up zelf?
  const [showPreview, setShowPreview] = useState(false);

  // Heeft dit apparaat een "echte" muis/trackpad (hover mogelijk), of is
  // het een telefoon/tablet zonder hover? Op een laptop/desktop blijft de
  // pop-up gewoon verschijnen/verdwijnen bij hoveren. Op een
  // telefoon/tablet bestaat "hoveren" niet — daar moet je op "Vlak" of
  // "Gewelfd" TIKKEN om de foto te zien, en blijft die foto vervolgens
  // gewoon staan (ook als je daarna ergens anders op het scherm tikt) totdat
  // je verdergaat naar de volgende stap — dan verdwijnt dit hele blok
  // sowieso van het scherm (gevraagd door Christiaan, 19-8-2026).
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setSupportsHover(query.matches);
  }, []);

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
    <div
      className="relative inline-block"
      onMouseEnter={supportsHover ? () => setShowPreview(true) : undefined}
      onMouseLeave={supportsHover ? () => setShowPreview(false) : undefined}
    >
      <div role="radiogroup" aria-label="Kies een afwerking" className="flex gap-3">
        {shape.availableFinishes.map((finish) => {
          const isSelected = selection.finish === finish;

          return (
            <button
              key={finish}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                dispatch({ type: "SET_FINISH", finish });
                // Zonder hover (telefoon/tablet): een tik op de knop toont
                // de foto meteen, en die blijft daarna gewoon staan.
                if (!supportsHover) setShowPreview(true);
              }}
              onFocus={supportsHover ? () => setShowPreview(true) : undefined}
              onBlur={supportsHover ? () => setShowPreview(false) : undefined}
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
          gewelfd emaille, boven de knoppen (zie left-0/translate-x hieronder
          voor de horizontale positie). Zichtbaar zodra je met je
          muis ergens boven deze hele blok (knoppen of pop-up) staat, of met
          het toetsenbord een knop focust — de onMouseEnter/Leave staan
          daarom op de buitenste, omvattende <div>, en niet los op elke
          knop: anders "flitste" de pop-up aan en uit zodra je muis tussen
          de knop en de pop-up in kwam (gemeld door Christiaan, 19-8-2026).
          De onzichtbare padding (pb-3) hoort ook bij dat omvattende
          hover-vlak, zodat er geen "dood" tussenstukje overblijft waar de
          muis per ongeluk de pop-up laat verdwijnen. */}
      {showPreview && (
        <div
          // left-0 (i.p.v. right-0): de foto begint bij de linkerkant van de
          // knoppen en groeit naar rechts. Met right-0 groeide de foto juist
          // naar links, en viel hij op een telefoon/tablet met een smal
          // scherm links van het scherm af (gemeld door Christiaan,
          // 19-8-2026). sm:/lg:translate-x-*: op een groter scherm schuift
          // de foto bovendien nog verder naar rechts.
          className="absolute bottom-full left-0 z-20 w-72 pb-3 sm:w-96 sm:translate-x-8 lg:translate-x-16"
          role="tooltip"
        >
          <div className="rounded-sm border border-border bg-card p-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/vlak-vs-gewelfd.jpg"
              alt="Voorbeeld van een huisnummerbordje in vlak emaille naast een huisnummerbordje in gewelfd emaille"
              className="w-full rounded-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
