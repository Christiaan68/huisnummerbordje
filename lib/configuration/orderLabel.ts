/**
 * Bouwt de mensleesbare "Volgorde"-tekst (bv. "Huisnummer boven, tekstregel
 * onder") die laat zien in welke volgorde het huisnummer en de eventuele
 * tekstregel(s) op het bordje komen te staan. Wordt gebruikt in zowel de
 * "Controle"-stap van de configurator (components/configurator/
 * ConfigurationSummary.tsx) als in de interne en klant-bevestigingsmail
 * (app/api/create-payment/route.ts en app/api/mollie-webhook/route.ts,
 * sinds 29-8-2026) — één plek, zodat de tekst overal
 * hetzelfde is. Bij een vorm zonder extra tekstregel is er niets te
 * ordenen, dus dan geeft deze functie undefined terug (geen "Volgorde"-
 * regel nodig).
 */
export function buildOrderLabel(
  shape: { extraLines: number },
  position: "start" | "middle" | "end"
): string | undefined {
  if (shape.extraLines === 0) return undefined;
  if (shape.extraLines === 1) {
    return position === "end"
      ? "Tekstregel boven, huisnummer onder"
      : "Huisnummer boven, tekstregel onder";
  }
  if (position === "middle") {
    return "Tekstregel 1 boven, huisnummer midden, tekstregel 2 onder";
  }
  if (position === "end") {
    return "Tekstregel 1 boven, tekstregel 2 midden, huisnummer onder";
  }
  return "Huisnummer boven, tekstregel 1 midden, tekstregel 2 onder";
}
