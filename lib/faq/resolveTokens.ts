import type { PricingData } from "@/lib/configuration/livePricing";
import { formatPriceCents } from "@/lib/configuration/pricing";
import { productColors } from "@/config/product-options";

/**
 * Vult prijs-tokens (en het e-mail-token, zie hieronder) in een FAQ-antwoord
 * in tegen de LIVE prijsgegevens (of, bij een storing, dezelfde reservekopie
 * als de configurator gebruikt — zie lib/configuration/livePricing.ts, waar
 * `pricingData` hier al doorheen is gegaan). Dit is de enige plek waar een
 * bedrag in de FAQ ontstaat: de antwoordtekst zelf (beheerd in de
 * prijsbeheeromgeving, zie lib/faq.js daar) bevat nooit een vast bedrag,
 * alleen een token zoals "{{kleur-voorbeeld-enkel}}".
 *
 * Kan een token niet betrouwbaar ingevuld worden (bv. geen enkel product
 * heeft een geldige verzendkoppeling), dan wordt NOOIT een verzonnen bedrag
 * getoond — in plaats daarvan een neutrale tekst die dat expliciet meldt.
 *
 * `contactEmail` (toegevoegd 18-9-2026, op verzoek van Christiaan): het
 * e-mailadres voor "{{contact-email}}", al opgehaald door de aanroeper (zie
 * app/faq/page.tsx) via dezelfde `getNotificationEmail("question_notification",
 * ...)` die ook de configurator-vraag-pop-up gebruikt — zo blijft ook dit
 * token, net als de prijs-tokens, altijd actueel zonder dat Christiaan het
 * adres los in een FAQ-antwoord hoeft te typen of bij te werken.
 */
export function resolveFaqTokens(
  text: string,
  pricingData: PricingData,
  contactEmail: string
): string {
  return text.replace(/\{\{([a-z0-9-]+)\}\}/g, (match, token: string) => {
    switch (token) {
      case "kleur-voorbeeld-enkel":
        return kleurVoorbeeldEnkel(pricingData);
      case "kleur-voorbeeld-dubbel":
        return kleurVoorbeeldDubbel(pricingData);
      case "teken-meerprijs":
        return `${formatPriceCents(pricingData.globalPricingOptions.extraCharPriceCents)} per extra teken`;
      case "kader-meerprijs":
        return formatPriceCents(pricingData.globalPricingOptions.frameSurchargeCents);
      case "verzend-voorbeeld":
        return verzendVoorbeeld(pricingData);
      case "contact-email":
        return contactEmail;
      default:
        // Onbekend/verwijderd token — laat de tekst ongemoeid staan i.p.v.
        // te crashen; een verkeerd getypt token in de beheertool valt zo
        // gewoon op als letterlijke tekst, in plaats van de hele pagina te
        // breken.
        return match;
    }
  });
}

function eersteMeerprijsKleur() {
  // productColors is de vaste namenlijst (niet prijsgevoelig, zie
  // config/product-options.ts) — welke kleuren standaard zijn (dus geen
  // meerprijs kosten) komt wél live uit pricingData, zie hieronder. We
  // pakken hier bewust pas de eerste kleur die op dit moment NIET standaard
  // is, zodat het voorbeeld nooit een kleur noemt die net standaard is
  // geworden.
  return productColors;
}

function kleurVoorbeeldEnkel(pricingData: PricingData): string {
  const nietStandaard = eersteMeerprijsKleur().find(
    (c) => !pricingData.globalPricingOptions.standardColorIds.includes(c.id)
  );
  const surcharge = pricingData.globalPricingOptions.colorSurchargeCents;
  if (!nietStandaard) {
    // Alle kleuren zijn (op dit moment) standaardkleuren — dan is er geen
    // voorbeeld van een meerprijskleur te geven.
    return `${formatPriceCents(surcharge)} (op dit moment zijn echter alle kleuren standaardkleuren, zonder meerprijs)`;
  }
  return `${nietStandaard.name} (+${formatPriceCents(surcharge)})`;
}

function kleurVoorbeeldDubbel(pricingData: PricingData): string {
  const nietStandaard = eersteMeerprijsKleur().find(
    (c) => !pricingData.globalPricingOptions.standardColorIds.includes(c.id)
  );
  const surcharge = pricingData.globalPricingOptions.colorSurchargeCents;
  const totaal = surcharge * 2;
  if (!nietStandaard) {
    return `2 × ${formatPriceCents(surcharge)} = ${formatPriceCents(totaal)} (op dit moment zijn echter alle kleuren standaardkleuren, zonder meerprijs)`;
  }
  return `ondergrond én opdruk allebei in ${nietStandaard.name}: 2 × ${formatPriceCents(surcharge)} = ${formatPriceCents(totaal)}`;
}

function verzendVoorbeeld(pricingData: PricingData): string {
  const voorbeeld = pricingData.productSizes.find(
    (s) =>
      s.shippingCarrierName != null &&
      s.shippingTierName != null &&
      s.shippingCostCents != null
  );
  if (!voorbeeld) {
    return "een bedrag dat we hier nog niet kunnen tonen (er is nog geen verzendstaffel gekoppeld) — het actuele verzendbedrag zie je altijd in de configurator, vóórdat je de bestelling afrondt";
  }
  return `${formatPriceCents(voorbeeld.shippingCostCents!)} via ${voorbeeld.shippingCarrierName} (${voorbeeld.shippingTierName}) bij het formaat ${voorbeeld.name}`;
}
