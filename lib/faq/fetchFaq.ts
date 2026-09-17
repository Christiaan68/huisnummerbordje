import { FAQ_CATEGORIES } from "@/lib/faq/categories";

/**
 * Haalt de gepubliceerde FAQ-vragen op bij de prijsbeheeromgeving (zie
 * api/v1/faq.js daar) — zelfde opzet (endpoint, x-api-key, timeout,
 * terugvalgedrag) als lib/configuration/livePricing.ts voor de prijzen.
 *
 * LET OP: dit is GEEN "reservekopie"-fallback zoals bij de prijzen — er is
 * hier bewust geen vaste, hardcoded lijst met FAQ-vragen. Lukt het ophalen
 * niet, dan geeft deze functie een lege lijst terug (`beschikbaar: false`) en
 * toont de FAQ-pagina een nette "tijdelijk niet beschikbaar"-melding, in
 * plaats van verouderde of verzonnen vragen te tonen (zie de expliciete eis
 * van Christiaan: nooit een bedrag of antwoord verzinnen of laten
 * verouderen).
 */

export interface FaqItem {
  id: number;
  category: string;
  question: string;
  /** Kan prijs-tokens bevatten, bv. "{{kleur-voorbeeld-enkel}}" — zie resolveTokens.ts. */
  answer: string;
  sortOrder: number;
}

export interface FaqData {
  items: FaqItem[];
  beschikbaar: boolean;
}

interface FaqApiResponse {
  categories: { id: string; label: string }[];
  items: FaqItem[];
}

function isValidFaqApiResponse(data: unknown): data is FaqApiResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.items)) return false;
  return d.items.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as FaqItem).category === "string" &&
      typeof (item as FaqItem).question === "string" &&
      typeof (item as FaqItem).answer === "string"
  );
}

export async function getFaqItems(): Promise<FaqData> {
  const baseUrl = process.env.PRIJSTOOL_API_URL;
  const apiKey = process.env.PRIJSTOOL_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn(
      "PRIJSTOOL_API_URL of PRIJSTOOL_API_KEY ontbreekt in de environment variables — " +
        "de FAQ-pagina kan geen vragen ophalen."
    );
    return { items: [], beschikbaar: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/faq`, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      console.error(`Prijstool gaf status ${res.status} terug bij het ophalen van de FAQ-vragen.`);
      return { items: [], beschikbaar: false };
    }

    const data: unknown = await res.json();
    if (!isValidFaqApiResponse(data)) {
      console.error("Prijstool gaf onverwachte gegevens terug bij het ophalen van de FAQ-vragen.");
      return { items: [], beschikbaar: false };
    }

    // Alleen bekende categorieën doorlaten — een onbekende/verouderde
    // categorie-id (bv. na een toekomstige wijziging) zou anders een vraag
    // buiten elke categorie-sectie laten vallen.
    const knownCategoryIds = new Set(FAQ_CATEGORIES.map((c) => c.id));
    const items = data.items.filter((item) => knownCategoryIds.has(item.category));

    return { items, beschikbaar: true };
  } catch (err) {
    console.error(
      "Kon de FAQ-vragen niet ophalen bij de prijstool.",
      err instanceof Error ? err.message : err
    );
    return { items: [], beschikbaar: false };
  }
}
