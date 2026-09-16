/**
 * Simpele centen → "€12,34"-opmaak van een kaal bedrag uit de database.
 * Gebruikt op de bedankt-pagina en in de e-mail bij een vraag over een
 * bestelling (zie app/bestelling/bedankt/page.tsx, app/api/payment-issue/
 * route.ts en lib/email/templates/payment-issue-notification.ts).
 *
 * Bewust als eigen, kleine losse functie toegevoegd (16-9-2026) in plaats
 * van iets uit lib/configuration/pricing.ts te hergebruiken: die is
 * toegespitst op een compleet prijsresultaat uit de prijstool (met
 * meerprijzen etc.), niet op het simpele, losse price_total_cents-veld dat
 * al in de database staat.
 */
export function formatEuroFromCents(cents: number | null): string {
  if (cents === null) return "onbekend";
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}
