"use client";

import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Losse, kleine client-component (27-8-2026) zodat components/layout/Footer.tsx
 * zelf een Server Component kan blijven — hetzelfde patroon dat al voor
 * LangcatTransitionLink werd gebruikt. Heropent het cookie-voorkeurenscherm
 * (components/consent/ConsentPreferencesModal.tsx), zodat een bezoeker zijn
 * eerder gemaakte keuze op elk moment kan wijzigen of intrekken.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent();

  return (
    <button type="button" onClick={openPreferences} className={className}>
      Cookie-instellingen
    </button>
  );
}
