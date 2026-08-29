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

/**
 * Vertaalt Mollie's eigen, technische naam van een betaalmethode (bv.
 * "ideal", "creditcard") naar een leesbare Nederlandse naam voor in de
 * bevestigingsmails — toegevoegd 29-8-2026, op verzoek van Christiaan, die
 * in de mails wilde kunnen zien dát en waarmee er betaald is (zie
 * app/api/mollie-webhook/route.ts, waar `payment.method` van Mollie
 * vandaan komt). Een methode die hier nog niet expliciet in de lijst staat
 * (Mollie voegt af en toe een nieuwe toe) valt terug op Mollies eigen naam
 * met een hoofdletter, zodat er nooit een lege/rare weergave ontstaat.
 */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ideal: "iDEAL",
  creditcard: "creditcard",
  bancontact: "Bancontact",
  banktransfer: "bankoverschrijving",
  belfius: "Belfius Pay Button",
  eps: "EPS",
  giftcard: "cadeaukaart",
  giropay: "Giropay",
  kbc: "KBC/CBC Betaalknop",
  mybank: "MyBank",
  paypal: "PayPal",
  paysafecard: "paysafecard",
  przelewy24: "Przelewy24",
  sofort: "Sofort",
  trustly: "Trustly",
  twint: "TWINT",
  applepay: "Apple Pay",
  in3: "in3",
  riverty: "Riverty (achteraf betalen)",
  billie: "Billie (achteraf betalen, zakelijk)",
  blik: "BLIK",
  mbway: "MB WAY",
  multibanco: "Multibanco",
  klarnapaylater: "Klarna (achteraf betalen)",
  klarnapaynow: "Klarna (direct betalen)",
  klarnasliceit: "Klarna (in delen betalen)",
  voucher: "voucher",
};

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "onbekend";
  return (
    PAYMENT_METHOD_LABELS[method] ??
    method.charAt(0).toUpperCase() + method.slice(1)
  );
}
