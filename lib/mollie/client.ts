import createMollieClient from "@mollie/api-client";

/**
 * Mollie-client voor het aanmaken/opvragen van betalingen (zie
 * app/api/create-payment/route.ts en app/api/mollie-webhook/route.ts).
 * Toegevoegd 29-8-2026. Gebruikt alleen server-side (API-routes) — nooit
 * importeren in client-componenten, want de API-sleutel mag nooit naar de
 * browser.
 *
 * Zelfde patroon als lib/email/resend.ts: een gewone functie (geen
 * "singleton"), leest de sleutel uit een environment variable, en gooit een
 * duidelijke, Nederlandse foutmelding als die ontbreekt.
 */
export function createMollie() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MOLLIE_API_KEY ontbreekt. Zet deze in .env.local (zie .env.example)."
    );
  }
  return createMollieClient({ apiKey });
}

/**
 * Het volledige, publieke adres van de webshop (zonder slash erachter),
 * nodig om Mollie een terugkeer-adres (redirectUrl) en een adres voor
 * betaalbevestigingen (webhookUrl) te kunnen geven — die moeten altijd een
 * "echt", vanaf internet bereikbaar adres zijn (localhost werkt niet).
 */
export function getSiteUrl(): string {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error(
      "SITE_URL ontbreekt. Zet deze in .env.local (zie .env.example)."
    );
  }
  return siteUrl.replace(/\/+$/, "");
}
