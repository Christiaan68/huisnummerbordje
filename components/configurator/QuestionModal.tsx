"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  questionDetailsSchema,
  type QuestionDetails,
} from "@/lib/validation/question.schema";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { cn } from "@/lib/utils";
import type { CreateConfigurationInput } from "@/types/configuration";

interface QuestionModalProps {
  onClose: () => void;
}

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

/**
 * Pop-up waarmee een bezoeker, tijdens het bevestigen van zijn
 * configuratie of tijdens het bevestigen van zijn contactgegevens (beide
 * op de configuratorstap "Controle", zie app/configurator/controle/page.tsx),
 * een vraag kan stellen aan de webshop — met zijn op dat moment gekozen
 * configuratie er automatisch bij. Verstuurt de vraag via
 * app/api/contact-question/route.ts naar Christiaan; dit is geen
 * bestelling en heeft geen invloed op het bestelproces zelf.
 */
export function QuestionModal({ onClose }: QuestionModalProps) {
  const { selection } = useConfigurator();
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionDetails>({
    resolver: zodResolver(questionDetailsSchema),
    defaultValues: { name: "", email: "", question: "" },
  });

  async function onSubmit(data: QuestionDetails) {
    if (
      !selection.shapeId ||
      !selection.finish ||
      !selection.colorId ||
      !selection.sizeId ||
      !selection.fontId
    ) {
      setStatus("error");
      setErrorMessage(
        "Je configuratie is nog niet compleet. Sluit dit venster en maak eerst al je keuzes."
      );
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const payload: CreateConfigurationInput & QuestionDetails = {
      shapeId: selection.shapeId,
      finish: selection.finish,
      colorId: selection.colorId,
      sizeId: selection.sizeId,
      fontId: selection.fontId,
      customText: selection.customText,
      extraLine1: selection.extraLine1 || undefined,
      extraLine2: selection.extraLine2 || undefined,
      numberPosition: selection.numberPosition,
      ...data,
    };

    try {
      const response = await fetch("/api/contact-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => null);
        setStatus("error");
        setErrorMessage(
          responseData?.error ??
            "Er ging iets mis bij het versturen. Probeer het opnieuw."
        );
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-primary">Vraag stellen</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {status === "success" ? (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Bedankt! Je vraag is verstuurd, inclusief je gekozen
              configuratie. We nemen zo snel mogelijk contact met je op via
              het e-mailadres dat je hebt ingevuld.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sluiten
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Stel hieronder je vraag. We sturen je gekozen configuratie
              automatisch mee, zodat we precies weten waar je vraag over
              gaat.
            </p>

            <div className="mt-4 rounded-sm border border-border bg-secondary/40 px-4">
              <ConfigurationSummary />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="question-name"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Naam
                </label>
                <input
                  id="question-name"
                  type="text"
                  {...register("name")}
                  className={fieldClass(!!errors.name)}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="question-email"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  E-mailadres
                </label>
                <input
                  id="question-email"
                  type="email"
                  {...register("email")}
                  className={fieldClass(!!errors.email)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="question-text"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Je vraag
                </label>
                <textarea
                  id="question-text"
                  rows={4}
                  {...register("question")}
                  className={fieldClass(!!errors.question)}
                />
                {errors.question && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.question.message}
                  </p>
                )}
              </div>

              {status === "error" && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex items-center justify-end gap-4 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {status === "submitting" ? "Bezig..." : "Vraag versturen"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
