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

/**
 * BIC → banknaam, alleen relevant bij iDEAL-betalingen (Mollie geeft dan
 * `payment.details.consumerBic` mee) — toegevoegd 16-9-2026, op verzoek van
 * Christiaan, zodat het beheertool naast de betaalmethode ook de bank kan
 * tonen. Bevat de banken die als iDEAL-issuer bij Mollie beschikbaar zijn.
 * Een onbekende BIC valt terug op de BIC zelf, zodat er nooit een verzonnen
 * banknaam getoond wordt (zie ook getFailureReasonLabel hieronder, zelfde
 * uitgangspunt).
 */
const BANK_NAME_BY_BIC: Record<string, string> = {
  ABNANL2A: "ABN AMRO",
  ASNBNL21: "ASN Bank",
  BUNQNL2A: "bunq",
  INGBNL2A: "ING",
  KNABNL2H: "Knab",
  RABONL2U: "Rabobank",
  RBRBNL21: "RegioBank",
  SNSBNL2A: "SNS Bank",
  TRIONL2U: "Triodos Bank",
  FVLBNL22: "Van Lanschot Kempen",
  NNBANL2G: "Nationale-Nederlanden",
  MOYONL21: "Moneyou",
  REVOLT21: "Revolut",
};

export function getBankName(bic: string | null | undefined): string | null {
  if (!bic) return null;
  return BANK_NAME_BY_BIC[bic] ?? bic;
}

/**
 * Mollie's eigen, technische foutreden bij een afgewezen creditcardbetaling
 * (`payment.details.failureReason`) vertaald naar het Nederlands —
 * toegevoegd 16-9-2026. Komt in de praktijk vrijwel alleen voor bij
 * creditcard: bij iDEAL geeft Mollie normaal gesproken geen aparte
 * foutreden mee, daar is de status zelf ('failed'/'expired'/'canceled') de
 * enige beschikbare informatie. Een reden die hier nog niet in staat, wordt
 * ongewijzigd (Mollie's eigen code) getoond in plaats van verzonnen te
 * worden — zie de afspraak hierover in het orderoverzicht.
 */
const FAILURE_REASON_LABELS: Record<string, string> = {
  invalid_card_number: "ongeldig kaartnummer",
  invalid_cvv: "ongeldige CVV-code",
  invalid_card_holder_name: "ongeldige naam kaarthouder",
  card_expired: "kaart verlopen",
  invalid_card_type: "kaarttype niet ondersteund",
  refer_to_card_issuer: "geweigerd door kaartuitgever",
  insufficient_funds: "onvoldoende saldo",
  inactive_card: "kaart niet actief",
  unauthorized: "niet geautoriseerd",
  possible_fraud: "mogelijke fraude gedetecteerd",
  unknown_reason: "onbekende reden",
};

export function getFailureReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return FAILURE_REASON_LABELS[reason] ?? reason;
}
