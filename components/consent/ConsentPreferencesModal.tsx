"use client";

import { useEffect, useId, useState } from "react";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Voorkeurenscherm voor cookies, toegevoegd 27-8-2026. Te openen vanuit
 * de banner ("Voorkeuren instellen") en vanuit de permanente
 * "Cookie-instellingen"-link in de footer (components/layout/Footer.tsx)
 * — in beide gevallen hetzelfde scherm, via de gedeelde ConsentProvider.
 *
 * Bewust maar twee categorieën: Noodzakelijk (altijd aan, niet
 * uitschakelbaar) en Analytisch (aan/uit). Geen marketingcategorie — zie
 * de toelichting in ConsentProvider.tsx en app/cookiebeleid.
 */
export function ConsentPreferencesModal() {
  const {
    isPreferencesOpen,
    closePreferences,
    analytics,
    savePreferences,
    acceptAll,
    rejectAll,
  } = useConsent();

  const analyticsToggleId = useId();

  // Lokale, nog-niet-opgeslagen keuze binnen het scherm — pas
  // daadwerkelijk toegepast bij het klikken op "Selectie opslaan" (of
  // meteen bij "Alles accepteren"/"Alles weigeren" hieronder). Wordt bij
  // elke keer openen opnieuw gelijkgezet aan de huidige, echte staat.
  const [draftAnalytics, setDraftAnalytics] = useState(analytics);

  useEffect(() => {
    if (isPreferencesOpen) {
      setDraftAnalytics(analytics);
    }
  }, [isPreferencesOpen, analytics]);

  if (!isPreferencesOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-preferences-title"
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="cookie-preferences-title"
            className="font-serif text-xl text-primary"
          >
            Cookie-instellingen
          </h2>
          <button
            type="button"
            onClick={closePreferences}
            aria-label="Sluiten"
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Kies hieronder welke cookies we mogen gebruiken. Je kunt deze
          keuze later altijd weer wijzigen via &ldquo;Cookie-instellingen&rdquo;
          onderaan de pagina.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-sm border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-foreground">
                Noodzakelijke cookies
              </span>
              <span className="flex-shrink-0 rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground">
                Altijd actief
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nodig om de webshop goed te laten werken. Deze staan altijd
              aan en kunnen niet worden uitgeschakeld.
            </p>
          </div>

          <div className="rounded-sm border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor={analyticsToggleId}
                className="text-sm font-medium text-foreground"
              >
                Analytische cookies
              </label>
              <input
                id={analyticsToggleId}
                type="checkbox"
                checked={draftAnalytics}
                onChange={(event) => setDraftAnalytics(event.target.checked)}
                className="h-5 w-5 flex-shrink-0 accent-primary"
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Helpen ons te begrijpen hoe de webshop wordt gebruikt, zodat
              we deze kunnen verbeteren. Hiervoor gebruiken we Google
              Analytics 4.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Alles weigeren
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Alles accepteren
          </button>
          <button
            type="button"
            onClick={() => savePreferences({ analytics: draftAnalytics })}
            className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Selectie opslaan
          </button>
        </div>
      </div>
    </div>
  );
}
