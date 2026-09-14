"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
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

      {/* 8e tegel, geen echte vorm (geen entry in productShapes — dat zou
          overal waar vormen doorgerekend/gemaild worden, o.a. pricing.ts,
          steps.ts en de e-mailtemplates, extra uitzonderingen vergen). Puur
          een link naar het algemene contactformulier, in dezelfde stijl als
          de andere kaarten ("bijpassend"), voor bezoekers die eerst een
          vraag willen stellen voordat ze een vorm kiezen (verzoek
          Christiaan, 14-9-2026). Stuurt naar hetzelfde e-mailadres als
          "Stel hier je vraag" op de controle-stap, zie
          app/api/contact-question-general/route.ts. */}
      <Link
        href="/contact/vraag"
        className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-border bg-card px-3 py-4 text-left transition-colors hover:border-primary/50"
      >
        <div className="flex h-24 w-full items-center justify-center rounded-sm bg-secondary sm:h-28">
          <HelpCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Iets anders nodig?
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Wil je iets speciaals of een andere vorm? Neem contact met ons op.
          </p>
        </div>
      </Link>
    </div>
  );
}
