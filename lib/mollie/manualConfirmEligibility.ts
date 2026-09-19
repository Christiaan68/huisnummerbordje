/**
 * Bepaalt of een order in aanmerking komt voor de knop "Order handmatig
 * bevestigen" in het beheertool (toegevoegd 19-9-2026, op verzoek van
 * Christiaan) — en de vertraging (in seconden) die daarbij getoond wordt.
 *
 * Bewust een pure, framework-loze module: geen database, geen Mollie-API,
 * alleen rekenwerk op timestamps die de aanroeper al heeft. Dat maakt 'm
 * zowel herbruikbaar (de webshop gebruikt 'm server-side als ENIGE bron van
 * waarheid vóór er ooit een mail verstuurd wordt, zie
 * app/api/admin/resend-order-emails/route.ts) als eenvoudig te testen (zie
 * manualConfirmEligibility.test.ts) zonder een echte database/Mollie-account
 * nodig te hebben.
 *
 * BELANGRIJK — welke 2 timestamps dit zijn: `mollieCreatedAt`/`molliePaidAt`
 * zijn Mollie's EIGEN `payment.createdAt`/`payment.paidAt` (zie
 * lib/mollie/client.ts en het onderzoek in database/mysql/orders-schema.sql,
 * migratie 19-9-2026) — NIET de bestaande kolommen `created_at`/`paid_at`,
 * die door onze EIGEN server bepaald worden en dus iets anders (net iets
 * eerder, resp. later) meten. Deze module rekent uitsluitend met de
 * Mollie-eigen waarden; het is aan de aanroeper om de juiste kolommen door
 * te geven.
 */

/** Grens uit de vraag van Christiaan: 8,0 seconden of minder = geen actie. */
export const MANUAL_CONFIRM_THRESHOLD_MS = 8000;

/**
 * Zet een Mollie-timestamp (ISO-8601-tekst, een `Date`, of leeg) om naar een
 * geldige `Date`, of `null` als de waarde ontbreekt of niet geldig is. Een
 * ongeldige tekst (bijvoorbeeld corrupte data) wordt hier bewust NIET
 * doorgezet als "toevallig 0" of een andere gok — `null` betekent overal in
 * deze module "niet betrouwbaar bekend", wat verderop altijd tot "geen
 * knop" leidt, nooit tot een verzonnen tijdsverschil.
 */
export function parseMollieTimestamp(
  value: string | Date | null | undefined
): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Het tijdsverschil tussen Mollie's `paidAt` en `createdAt`, in
 * milliseconden — of `null` als één van beide (of allebei) niet betrouwbaar
 * bekend zijn. Een negatief verschil (paidAt vóór createdAt, wat normaal
 * nooit voor kan komen) wordt ook als `null` behandeld — dat duidt op een
 * dataprobleem, geen betrouwbare vertraging.
 */
export function getMollieDelayMs(
  mollieCreatedAt: string | Date | null | undefined,
  molliePaidAt: string | Date | null | undefined
): number | null {
  const created = parseMollieTimestamp(mollieCreatedAt);
  const paid = parseMollieTimestamp(molliePaidAt);
  if (!created || !paid) return null;

  const diffMs = paid.getTime() - created.getTime();
  return diffMs < 0 ? null : diffMs;
}

/** Zelfde als getMollieDelayMs, maar in (fractionele) seconden — puur voor weergave. */
export function getMollieDelaySeconds(
  mollieCreatedAt: string | Date | null | undefined,
  molliePaidAt: string | Date | null | undefined
): number | null {
  const ms = getMollieDelayMs(mollieCreatedAt, molliePaidAt);
  return ms === null ? null : ms / 1000;
}

export interface ManualConfirmEligibilityInput {
  /** Alleen 'paid' komt ooit in aanmerking — elke andere status (of leeg) niet. */
  paymentStatus: string | null | undefined;
  mollieCreatedAt: string | Date | null | undefined;
  molliePaidAt: string | Date | null | undefined;
  /** true als deze order al eerder handmatig bevestigd is. */
  alreadyConfirmed: boolean;
}

/**
 * DE beslissing: mag de knop "Order handmatig bevestigen" getoond worden
 * (beheertool) / mag de server de bevestiging daadwerkelijk uitvoeren
 * (webshop-route)? Beide kanten gebruiken dezelfde formule hieronder, zodat
 * de UI nooit iets anders "denkt" dan wat de server uiteindelijk ook echt
 * afdwingt — al is het door de twee-projecten-opzet van deze applicatie
 * (beheertool = JavaScript, webshop = TypeScript) niet dezelfde functie-
 * aanroep, wel dezelfde regel: paid + beide timestamps bekend + verschil
 * STRIKT groter dan 8 seconden + nog niet eerder bevestigd.
 */
export function isEligibleForManualConfirmation(
  input: ManualConfirmEligibilityInput
): boolean {
  if (input.paymentStatus !== "paid") return false;
  if (input.alreadyConfirmed) return false;

  const delayMs = getMollieDelayMs(input.mollieCreatedAt, input.molliePaidAt);
  if (delayMs === null) return false;

  // Strikt groter dan — exact 8,0 seconden telt NIET als "meer dan 8 sec".
  return delayMs > MANUAL_CONFIRM_THRESHOLD_MS;
}
