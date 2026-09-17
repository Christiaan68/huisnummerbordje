/**
 * Vaste categorie-indeling van de klant-FAQ (toegevoegd 17-9-2026) — moet
 * exact overeenkomen met FAQ_CATEGORIES in lib/faq.js van de
 * prijsbeheeromgeving (huisnummerbordjes-prijsbeheer-web). Dit is bewust een
 * kleine, vaste (niet-prijsgevoelige) lijst die niet via de live-koppeling
 * hoeft te lopen — alleen de vragen zelf en de bedragen in de antwoorden
 * komen live uit de prijsbeheeromgeving (zie fetchFaq.ts / resolveTokens.ts).
 */
export interface FaqCategory {
  id: string;
  label: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: "product-materiaal", label: "Product en materiaal" },
  { id: "personaliseren", label: "Personaliseren" },
  { id: "bestellen-betalen", label: "Bestellen en betalen" },
  { id: "levering-montage", label: "Levering en montage" },
  { id: "retourneren-service", label: "Retourneren en service" },
];

export function faqCategoryLabel(id: string): string {
  return FAQ_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
