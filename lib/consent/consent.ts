/**
 * Cookie-toestemming (AVG/cookiewet), toegevoegd 27-8-2026.
 *
 * Bewaart precies twee dingen: of de bezoeker analytische cookies
 * (Google Analytics 4) heeft toegestaan, en wanneer dat is vastgelegd.
 * "Noodzakelijke cookies" hoeven geen aan/uit-status te hebben: die zijn
 * er sowieso, zonder toestemming (en de webshop zet er op dit moment in
 * de praktijk ook geen enkele — zie de toelichting in app/cookiebeleid).
 *
 * Er is bewust GEEN aparte marketingcategorie: uit de code-inventarisatie
 * van 27-8-2026 blijkt dat er geen enkele marketing-/advertentietracking
 * (Google Ads, Meta Pixel, TikTok Pixel, e.d.) in de webshop aanwezig is.
 * Mocht dat later wél worden toegevoegd, dan hoort daar een eigen
 * marketing-toggle bij (zie de toelichting bovenaan
 * components/consent/ConsentProvider.tsx).
 *
 * Deze toestemming wordt bewaard in een eigen, functionele cookie (géén
 * trackingcookie) zodat de banner niet bij elk bezoek opnieuw verschijnt.
 */

export const CONSENT_COOKIE_NAME = "cookievoorkeur";
export const CONSENT_COOKIE_MAX_AGE_DAYS = 180;

/** Huidig versienummer van de opgeslagen structuur — ophogen als het
 * formaat ooit wijzigt, zodat oude, onbekende waarden genegeerd worden
 * in plaats van verkeerd geïnterpreteerd. */
const CONSENT_VERSION = 1;

export interface ConsentPreferences {
  analytics: boolean;
}

export interface StoredConsent extends ConsentPreferences {
  version: number;
  updatedAt: string;
}

export function parseConsentCookie(
  raw: string | undefined | null
): StoredConsent | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as { analytics?: unknown }).analytics !== "boolean"
    ) {
      return null;
    }
    const candidate = parsed as { analytics: boolean; version?: unknown; updatedAt?: unknown };
    return {
      analytics: candidate.analytics,
      version:
        typeof candidate.version === "number" ? candidate.version : CONSENT_VERSION,
      updatedAt:
        typeof candidate.updatedAt === "string"
          ? candidate.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function serializeConsent(prefs: ConsentPreferences): string {
  const stored: StoredConsent = {
    analytics: prefs.analytics,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  return encodeURIComponent(JSON.stringify(stored));
}

/** Alleen aan te roepen vanuit client-componenten. */
export function writeConsentCookieClient(prefs: ConsentPreferences): void {
  if (typeof document === "undefined") return;
  const value = serializeConsent(prefs);
  const maxAgeSeconds = CONSENT_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

/**
 * Verwijdert bestaande Google Analytics-cookies (_ga, _ga_<...>) actief
 * van de browser, voor het geval de bezoeker eerder wél had
 * geaccepteerd en zijn toestemming nu intrekt. Dit is een aanvulling op
 * (niet een vervanging van) het bijwerken van de gtag-consentstatus —
 * die zorgt ervoor dat er vanaf dat moment geen nieuwe analytische data
 * meer verzameld wordt, dit ruimt alleen op wat er al stond.
 */
export function clearGoogleAnalyticsCookies(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const hostname = window.location.hostname;
  const hostParts = hostname.split(".");
  const rootDomain =
    hostParts.length > 1 ? `.${hostParts.slice(-2).join(".")}` : null;

  document.cookie.split("; ").forEach((entry) => {
    const name = entry.split("=")[0]?.trim();
    if (!name || !name.startsWith("_ga")) return;

    // Zonder domain-attribuut (dekt cookies gezet op het exacte host).
    document.cookie = `${name}=; path=/; max-age=0`;
    // Met domain-attribuut (dekt cookies gezet op het "kale" domein).
    if (rootDomain) {
      document.cookie = `${name}=; path=/; domain=${rootDomain}; max-age=0`;
    }
  });
}
