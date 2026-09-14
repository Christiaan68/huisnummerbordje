"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  questionDetailsSchema,
  type QuestionDetails,
} from "@/lib/validation/question.schema";
import { cn } from "@/lib/utils";

// Zelfde Nederlandse-postcode-check en opzoekactie (PDOK, postcode-alleen)
// als components/configurator/ContactDetailsForm.tsx — hier puur om het
// (optionele) invullen van straat/plaats te vergemakkelijken.
const NL_POSTCODE_REGEX = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionDetails>({
    resolver: zodResolver(questionDetailsSchema),
    defaultValues: {
      name: "",
      email: "",
      question: "",
      phone: "",
      postalCode: "",
      houseNumber: "",
      street: "",
      city: "",
    },
  });

  // Optionele opzoekactie straat/plaats op basis van postcode — zelfde
  // opzet als in ContactDetailsForm.tsx, hier alleen ter vergemakkelijking
  // (de velden zijn niet verplicht, zie lib/validation/question.schema.ts).
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "found" | "not-found"
  >("idle");
  const lastLookedUpKey = useRef<string | null>(null);
  const postalCodeValue = watch("postalCode") ?? "";

  useEffect(() => {
    const normalizedPostcode = postalCodeValue.replace(/\s+/g, "").toUpperCase();

    if (!NL_POSTCODE_REGEX.test(postalCodeValue)) {
      setLookupStatus("idle");
      return;
    }

    const key = normalizedPostcode;
    if (key === lastLookedUpKey.current) return;

    const timeoutId = setTimeout(async () => {
      lastLookedUpKey.current = key;
      setLookupStatus("loading");
      setValue("street", "", { shouldValidate: false });
      setValue("city", "", { shouldValidate: false });
      try {
        const res = await fetch(
          `/api/postcode-lookup?postcode=${encodeURIComponent(normalizedPostcode)}`
        );
        const data: { found: boolean; street?: string; city?: string } =
          await res.json();
        if (lastLookedUpKey.current !== key) return;
        if (data.found && data.street && data.city) {
          setValue("street", data.street, { shouldValidate: false });
          setValue("city", data.city, { shouldValidate: false });
          setLookupStatus("found");
        } else {
          setLookupStatus("not-found");
        }
      } catch {
        if (lastLookedUpKey.current === key) setLookupStatus("not-found");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCodeValue]);

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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        autoComplete="on"
      >
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
            autoComplete="name"
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
            autoComplete="email"
            {...register("email")}
            className={fieldClass(!!errors.email)}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Adres/telefoon: bewust optioneel (alleen naam + e-mail zijn
            verplicht, zie lib/validation/question.schema.ts) — op verzoek
            van Christiaan (14-9-2026) wel gevraagd, zodat hij bij het
            beantwoorden meteen alle gegevens bij de hand heeft. */}
        <p className="-mb-1 text-xs text-muted-foreground">
          De onderstaande gegevens zijn niet verplicht, maar helpen ons je
          sneller op weg.
        </p>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label
              htmlFor="question-postalCode"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Postcode <span className="text-muted-foreground">(optioneel)</span>
            </label>
            <input
              id="question-postalCode"
              type="text"
              inputMode="text"
              placeholder="1234 AB"
              autoComplete="postal-code"
              {...register("postalCode")}
              className={fieldClass(!!errors.postalCode)}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-destructive">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="question-houseNumber"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Huisnummer
            </label>
            <input
              id="question-houseNumber"
              type="text"
              placeholder="12A"
              autoComplete="address-line2"
              {...register("houseNumber")}
              className={cn(fieldClass(!!errors.houseNumber), "w-24")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="question-street"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Straat
              {lookupStatus === "loading" && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  bezig met opzoeken…
                </span>
              )}
              {lookupStatus === "not-found" && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  niet gevonden — vul zelf in
                </span>
              )}
            </label>
            <input
              id="question-street"
              type="text"
              autoComplete="address-line1"
              {...register("street")}
              className={fieldClass(!!errors.street)}
            />
          </div>

          <div>
            <label
              htmlFor="question-city"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Woonplaats
            </label>
            <input
              id="question-city"
              type="text"
              autoComplete="address-level2"
              {...register("city")}
              className={fieldClass(!!errors.city)}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="question-phone"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Telefoonnummer <span className="text-muted-foreground">(optioneel)</span>
          </label>
          <input
            id="question-phone"
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            className={fieldClass(!!errors.phone)}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
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
