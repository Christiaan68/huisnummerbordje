import { getPool } from "@/lib/mysql/client";

/**
 * Leest, per vorm van een huisnummerbordje, in welke taal de interne
 * meldingsmail "Configuratie bestelling webshop" verstuurd moet worden
 * (zie lib/email/templates/configuration-confirmation.ts). Dit adres wordt
 * beheerd vanuit de prijstool ("Taal per vorm", zie public/admin.js en
 * lib/shape-settings.js daar) en is opgeslagen in de tabel "shape_settings"
 * — dezelfde MySQL-database als de bestellingen, en hetzelfde opzet als
 * lib/email/settings.ts voor de meldingsadressen: wijzig je in de prijstool
 * de taal van een vorm, dan gebruikt de webshop dat vanaf de eerstvolgende
 * (betaalde) bestelling meteen, zonder herdeploy.
 *
 * Gooit NOOIT een fout door — als de database niet bereikbaar is, de tabel
 * nog niet bestaat, of er voor deze vorm nog nooit een taal is ingesteld,
 * valt dit terug op Nederlands ("nl"). Een storing in deze instelling-opslag
 * mag nooit het versturen van de bestelmail blokkeren.
 */
export async function getShapeLanguage(shapeId: string): Promise<"nl" | "de"> {
  try {
    const db = getPool();
    const [rows] = (await db.execute(
      "SELECT language FROM shape_settings WHERE shape_id = ? LIMIT 1",
      [shapeId]
    )) as unknown as [Array<{ language: string }>, unknown];
    if (Array.isArray(rows) && rows.length > 0 && rows[0].language === "de") {
      return "de";
    }
  } catch (err) {
    console.error(
      `Ophalen van de ingestelde taal voor vorm '${shapeId}' is mislukt, terugval op Nederlands:`,
      err
    );
  }
  return "nl";
}
