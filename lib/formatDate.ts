/**
 * Formatteert een datum/tijd in het Nederlands, in de Nederlandse tijdzone
 * (Europe/Amsterdam) — ongeacht in welke tijdzone de server zelf draait
 * (Vercel rekent standaard in UTC). Gedeelde variant van de aanpak die al
 * gebruikt werd in lib/email/templates/configuration-confirmation.ts (zie
 * de tijdzone-bugfix van 29-8-2026, waar zonder deze instelling de tijd in
 * de zomer 2 uur en in de winter 1 uur verkeerd stond) — zodat een nieuwe
 * datum/tijd-weergave (zoals het betaalmoment, zie
 * lib/mollie/client.ts / app/api/mollie-webhook/route.ts) niet opnieuw
 * dezelfde bug kan introduceren.
 */
export function formatDutchDateTime(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return parsed.toLocaleString("nl-NL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });
}
