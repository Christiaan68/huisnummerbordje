"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  questionDetailsSchema,
  type QuestionDetails,
} from "@/lib/validation/question.schema";
import { cn } from "@/lib/utils";

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

/**
 * Algemeen contactformulier op /contact/vraag — voor een vraag die NIET aan
 * een configuratie in uitvoering gekoppeld is (voor dat geval, vanuit de
 * configurator zelf, zie components/configurator/QuestionModal.tsx). Stuurt
 * naar app/api/contact-question-general/route.ts, dat de vraag doorstuurt
 * naar het e-mailadres dat in de prijstool is ingesteld onder "Vraag klant
 * naar" (zelfde adres/instelling als de configurator-vraag gebruikt).
 *
 * De introzin boven het formulier ("Heb je een vraag over...") staat
 * bewust HIER (in plaats van statisch op app/contact/vraag/page.tsx) en
 * wordt alleen getoond zolang het formulier nog niet verstuurd is — na het
 * versturen hoort alleen de bedankmelding + "Naar home"-knop te staan, niet
 * meer die introzin (op verzoek van Christiaan).
 */
export function ContactQuestionForm() {
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
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact-question-general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  if (status === "success") {
    return (
      <div className="mt-6">
        <p className="text-sm text-muted-foreground">
          Bedankt! Je vraag is verstuurd. We nemen zo snel mogelijk contact
          met je op via het e-mailadres dat je hebt ingevuld.
        </p>
        {/* "Naar home" staat bewust alleen hier, ná het versturen — tijdens
            het invullen van het formulier hoort alleen "Vraag versturen"
            zichtbaar te zijn. */}
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-sm border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50"
        >
          Naar home
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Heb je een vraag over onze geëmailleerde huisnummerbordjes? Vul
        onderstaand formulier in, we nemen zo snel mogelijk contact met je
        op.
      </p>

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
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
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
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
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
            rows={5}
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

        <div className="pt-2">
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
  );
}
