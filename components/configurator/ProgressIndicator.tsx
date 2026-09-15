"use client";

import { usePathname } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { getVisibleSteps } from "@/lib/configuration/steps";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { useTopBarAction } from "@/lib/configuration/TopBarActionContext";
import { cn } from "@/lib/utils";

export function ProgressIndicator() {
  const pathname = usePathname();
  const { selection } = useConfigurator();
  // De "Verder"/"Configuratie bevestigen"-knop van de huidige stap, hier
  // rechts naast de tabjes getoond (op verzoek van Christiaan, 15-9-2026,
  // zodat die knop niet alleen onderaan de pagina staat) — elke stap meldt
  // zijn eigen knop aan via TopBarActionContext (zie ConfiguratorNav.tsx en
  // app/configurator/controle/page.tsx), deze component weet zelf niets
  // over de stap-specifieke logica erachter.
  const { action } = useTopBarAction();
  // Sinds 9-9-2026 (7 vormen): toont alleen de stappen die voor de huidig
  // gekozen vorm van toepassing zijn (zie lib/configuration/steps.ts,
  // getVisibleSteps) — zo krijgt een klant met een "oren"-vorm bv. geen
  // voortgangsbolletje voor "Afwerking"/"Maat"/"Opties" te zien. Voor de 4
  // oorspronkelijke vormen bevat deze lijst nog steeds alle stappen, dus
  // daar verandert er niets.
  const visibleSteps = getVisibleSteps(selection);
  const currentIndex = visibleSteps.findIndex((step) => step.path === pathname);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ol className="flex flex-1 items-center gap-1 sm:gap-2">
      {visibleSteps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex && step.isComplete(selection);

        return (
          <li key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors sm:h-8 sm:w-8",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isDone &&
                    !isCurrent &&
                    "border-primary/60 bg-primary/10 text-primary",
                  !isCurrent &&
                    !isDone &&
                    "border-border bg-transparent text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone && !isCurrent ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] uppercase tracking-wide sm:block",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {index < visibleSteps.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-px flex-1 sm:mb-6",
                  index < currentIndex ? "bg-primary/50" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
      </ol>

      {/* Bewust ONDER de tabjes als de ruimte krap wordt (flex-wrap hierboven
          + ml-auto hier) i.p.v. de tabjes te laten verdrukken — zo blijft er
          op mobiel voldoende witruimte omdat beide rijen dan hun eigen volle
          breedte houden. */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors sm:px-6 sm:py-3",
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
