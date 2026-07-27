"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { configuratorSteps, getStepIndex } from "@/lib/configuration/steps";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { cn } from "@/lib/utils";

interface ConfiguratorNavProps {
  /** id van de huidige stap, bv. "vorm", "kleur", ... */
  stepId: string;
}

export function ConfiguratorNav({ stepId }: ConfiguratorNavProps) {
  const router = useRouter();
  const { selection, dispatch } = useConfigurator();

  const currentIndex = configuratorSteps.findIndex((s) => s.id === stepId);
  const currentStep = configuratorSteps[currentIndex];
  const previousStep = configuratorSteps[currentIndex - 1];
  const nextStep = configuratorSteps[currentIndex + 1];

  const canProceed = currentStep ? currentStep.isComplete(selection) : false;

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
