"use client";

import Link from "next/link";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Cookiebanner, toegevoegd 27-8-2026 (zie ConsentProvider.tsx voor de
 * technische werking). Verschijnt alleen zolang er nog geen keuze is
 * vastgelegd (status "unset"). "Alleen noodzakelijke cookies" en "Alles
 * accepteren" zijn bewust gelijkwaardig gestyled (zelfde formaat,
 * dezelfde rand om de knop) — weigeren mag niet moeilijker worden
 * gemaakt dan accepteren.
 */
export function ConsentBanner() {
  const { status, acceptAll, acceptNecessaryOnly, openPreferences } =
    useConsent();

  if (status !== "unset") return null;

  return (
    <div
      role="region"
      aria-label="Cookiemelding"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-border bg-card px-6 py-6 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] sm:px-10"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-serif text-base text-foreground sm:text-lg">
            Wij gebruiken cookies
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            We gebruiken noodzakelijke cookies om onze webshop goed te
            laten werken. Met jouw toestemming gebruiken we ook
            analytische cookies om te begrijpen hoe onze webshop wordt
            gebruikt en om deze te verbeteren. Hiervoor maken we onder
            andere gebruik van Google Analytics. Lees meer in ons{" "}
            <Link
              href="/cookiebeleid"
              className="underline underline-offset-4 hover:text-foreground"
            >
              cookiebeleid
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-shrink-0 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openPreferences}
            className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Voorkeuren instellen
          </button>
          <button
            type="button"
            onClick={acceptNecessaryOnly}
            className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Alleen noodzakelijke cookies
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Alles accepteren
          </button>
        </div>
      </div>
    </div>
  );
}
