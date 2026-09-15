"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { configuratorSteps, getVisibleSteps } from "@/lib/configuration/steps";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { useTopBarAction } from "@/lib/configuration/TopBarActionContext";
import { cn } from "@/lib/utils";

interface ConfiguratorNavProps {
  /** id van de huidige stap, bv. "vorm", "kleur", ... */
  stepId: string;
}

export function ConfiguratorNav({ stepId }: ConfiguratorNavProps) {
  const router = useRouter();
  const { selection, dispatch } = useConfigurator();
  const { setAction } = useTopBarAction();

  // Sinds 9-9-2026 (7 vormen): "Terug"/"Verder" navigeren binnen de
  // stappenlijst die voor de HUIDIG GEKOZEN vorm van toepassing is (zie
  // lib/configuration/steps.ts, getVisibleSteps) — zo slaan "oren"-vormen
  // bv. de stappen "Afwerking"/"Maat"/"Opties" gewoon over. Voor de 4
  // oorspronkelijke vormen bevat deze lijst nog steeds alle stappen, dus
  // daar verandert er niets.
  const visibleSteps = getVisibleSteps(selection);
  const currentIndex = visibleSteps.findIndex((s) => s.id === stepId);
  const currentStep = visibleSteps[currentIndex];
  const previousStep = visibleSteps[currentIndex - 1];
  const nextStep = visibleSteps[currentIndex + 1];

  const canProceed = currentStep ? currentStep.isComplete(selection) : false;

  // Meldt dezelfde "Verder"-knop aan bij ProgressIndicator.tsx, zodat die
  // ook bovenaan (naast de stap-tabjes) getoond wordt — zie
  // lib/configuration/TopBarActionContext.tsx. Bij het verlaten van de stap
  // (of als er geen volgende stap is, zoals op "Controle" — die gebruikt
  // deze component niet) weer opgeruimd.
  useEffect(() => {
    if (!nextStep) {
      setAction(null);
      return;
    }
    setAction({
      label: "Verder",
      onClick: () => router.push(nextStep.path),
      disabled: !canProceed,
    });
    return () => setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextStep?.path, canProceed]);

  function handleReset() {
    const confirmed = window.confirm(
      "Weet je zeker dat je opnieuw wilt beginnen? Al je keuzes worden gewist."
    );
    if (!confirmed) return;
    dispatch({ type: "RESET" });
    router.push(configuratorSteps[0].path);
  }

  return (
    <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
      <div>
        {previousStep ? (
          <button
            type="button"
            onClick={() => router.push(previousStep.path)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Terug
          </button>
        ) : (
          <span />
        )}
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Opnieuw beginnen
      </button>

      <div>
        {nextStep && (
          <button
            type="button"
            disabled={!canProceed}
            onClick={() => canProceed && router.push(nextStep.path)}
            className={cn(
              "inline-flex items-center gap-1 rounded-sm px-6 py-3 text-sm font-medium transition-colors",
              canProceed
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-secondary text-muted-foreground"
            )}
          >
            Verder
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
