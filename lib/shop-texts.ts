import { getPool } from "@/lib/mysql/client";

/**
 * Teksten voor klanten die in de beheertool worden ingesteld (toegevoegd
 * 23-11-2026, op verzoek van Christiaan). Ze staan in de tabel "shop_texts"
 * in dezelfde database als de bestellingen; de beheertool maakt en vult die
 * tabel (menu "Verwachte levertijd"). Een wijziging daar geldt bij de
 * eerstvolgende bestelling meteen, zonder herdeploy — net als
 * "email_settings" (zie lib/email/settings.ts).
 *
 * Gooit NOOIT een fout: is de database niet bereikbaar, bestaat de tabel nog
 * niet of is er niets ingevuld, dan geldt "4 tot 6" weken. Een storing
 * hier mag nooit een bevestigingsmail of de bedankpagina blokkeren.
 */

/**
 * De zin is vast (gelijk aan de FAQ); alleen het aantal weken komt uit de
 * beheertool, bijvoorbeeld "4 tot 6". Niets ingevuld = "4 tot 6".
 */
export const DEFAULT_DELIVERY_WEEKS = "4 tot 6";

export function expectedDeliverySentence(weeks: string): string {
  return `Vanwege maatwerk houden we een levertermijn van maximaal ${weeks} weken na het plaatsen van je bestelling aan.`;
}

export async function getExpectedDeliveryText(): Promise<string> {
  let weeks = DEFAULT_DELIVERY_WEEKS;
  try {
    const db = getPool();
    const [rows] = (await db.execute(
      "SELECT text_value FROM shop_texts WHERE text_key = ? LIMIT 1",
      ["expected_delivery"]
    )) as unknown as [Array<{ text_value: string | null }>, unknown];
    const value = Array.isArray(rows) && rows.length > 0 ? rows[0].text_value : null;
    // Voor de zekerheid: "weken" niet dubbel als het er toch bij is getypt.
    const cleaned = (value ?? "").replace(/\s*weken\s*$/i, "").trim();
    if (cleaned) weeks = cleaned;
  } catch (err) {
    console.error(
      "Ophalen van de verwachte levertijd is mislukt, terugval op standaard (4 tot 6 weken):",
      err instanceof Error ? err.message : err
    );
  }
  return expectedDeliverySentence(weeks);
}
