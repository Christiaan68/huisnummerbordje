import { getPool } from "@/lib/mysql/client";

/**
 * Leest e-mailadressen die zijn opgeslagen in de tabel "email_settings" (in
 * dezelfde MySQL-database als de bestellingen) — deze tabel wordt beheerd
 * vanuit de prijstool (knop "E-mailinstellingen") en is gedeeld tussen de
 * webshop en de prijstool: wijzig je daar een adres, dan gebruikt de webshop
 * dat vanaf de eerstvolgende aanvraag meteen, zonder herdeploy.
 *
 * Gooit NOOIT een fout door — als de database niet bereikbaar is of de
 * tabel nog niet bestaat, valt dit terug op het meegegeven standaardadres.
 * Een storing in deze instelling-opslag mag nooit het versturen van een
 * bestel- of vraagmelding blokkeren.
 */
export async function getNotificationEmail(
  key: "order_notification" | "question_notification" | "price_list",
  fallback: string
): Promise<string> {
  try {
    const db = getPool();
    const [rows] = (await db.execute(
      "SELECT email FROM email_settings WHERE setting_key = ? LIMIT 1",
      [key]
    )) as unknown as [Array<{ email: string }>, unknown];
    if (Array.isArray(rows) && rows.length > 0 && rows[0].email) {
      return rows[0].email;
    }
  } catch (err) {
    console.error(
      `Ophalen van e-mailinstelling '${key}' is mislukt, terugval op standaardadres:`,
      err
    );
  }
  return fallback;
}
