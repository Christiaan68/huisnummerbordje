"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { configuratorSteps, getStepIndex } from "@/lib/configuration/steps";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { cn } from "@/lib/utils";

export function ProgressIndicator() {
  const pathname = usePathname();
  const { selection } = useConfigurator();
  const currentIndex = getStepIndex(pathname);

  return (
    <ol className="flex items-center gap-1 sm:gap-2">
      {configuratorSteps.map((step, index) => {
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

            {index < configuratorSteps.length - 1 && (
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
  );
}
