"use client";

import { ChevronRight } from "lucide-react";
import { useTopBarAction } from "@/lib/configuration/TopBarActionContext";
import { cn } from "@/lib/utils";

interface StepHeaderProps {
  /** Bv. "Configurator — stap 2 van 7". */
  eyebrow: string;
  /** Bv. "Afwerking". */
  title: string;
}

/**
 * Titelblok van elke configuratorstap ("Configurator — stap X van Y" +
 * de (oranje) staptitel eronder), met — sinds 15-9-2026, op verzoek van
 * Christiaan — de "Verder"/"Configuratie bevestigen"-knop van die stap
 * rechts ernaast.
 *
 * Deze knop stond eerst bovenin naast de stap-TABJES (ProgressIndicator),
 * maar viel daar op een andere hoogte dan de staptitel, en dus niet mooi
 * boven de onderste knop uitgelijnd — Christiaan wilde 'm juist op dezelfde
 * hoogte als de oranje titel ("Vorm", "Afwerking", ...). Omdat die titel
 * niet in ProgressIndicator.tsx staat maar in elke stappagina apart, is de
 * knop daarom hierheen verplaatst: elke stappagina gebruikt dit ene
 * gedeelde titelblok, dus de knop lijnt overal vanzelf exact naast de
 * titel uit, zonder dat elke pagina zijn eigen knoplogica hoeft te
 * herhalen. De knop zelf komt nog steeds uit TopBarActionContext (zie
 * ConfiguratorNav.tsx en app/configurator/controle/page.tsx voor wie 'm
 * per stap aanmeldt).
 */
export function StepHeader({ eyebrow, title }: StepHeaderProps) {
  const { action } = useTopBarAction();

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-primary">{title}</h1>
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors sm:px-6 sm:py-3",
            !action.disabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-secondary text-muted-foreground"
          )}
        >
          {action.label}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
