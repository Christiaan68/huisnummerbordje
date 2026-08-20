import mysql from "mysql2/promise";

/**
 * Verbinding met de MySQL-database (TiDB Cloud) waarin bevestigde
 * bestellingen worden bewaard — als aanvulling op de e-mail die bij elke
 * bestelling al verstuurd wordt (zie app/api/send-email/route.ts).
 *
 * Gebruikt een "pool" (een klein aantal herbruikbare verbindingen) in
 * plaats van voor elk verzoek een nieuwe verbinding te openen. De pool
 * staat op een module-niveau variabele, zodat "warme" serverfuncties (die
 * Vercel soms hergebruikt tussen verzoeken) 'm kunnen hergebruiken in
 * plaats van er telkens een nieuwe te maken.
 */
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const host = process.env.TIDB_HOST;
  const user = process.env.TIDB_USER;
  const password = process.env.TIDB_PASSWORD;
  const database = process.env.TIDB_DATABASE;

  if (!host || !user || !password || !database) {
    throw new Error(
      "TIDB_HOST, TIDB_USER, TIDB_PASSWORD of TIDB_DATABASE ontbreekt in de environment variables."
    );
  }

  pool = mysql.createPool({
    host,
    port: process.env.TIDB_PORT ? Number(process.env.TIDB_PORT) : 4000,
    user,
    password,
    database,
    // TiDB Cloud staat alleen beveiligde (TLS-)verbindingen toe, en gebruikt
    // een publiek vertrouwd certificaat (Let's Encrypt) — er is dus géén
    // los certificaatbestand nodig, alleen deze regel.
    ssl: { minVersion: "TLSv1.2" },
    // Klein aantal verbindingen tegelijk: dit project heeft geen hoog
    // verkeer, en een kleine pool voorkomt onnodig veel losse verbindingen
    // vanuit de (mogelijk meerdere, tegelijk actieve) serverfuncties van
    // Vercel. TiDB Cloud's gratis Starter-cluster staat tot 400 gelijktijdige
    // verbindingen toe — hier blijven we daar ruim onder.
    connectionLimit: 3,
    maxIdle: 3,
    // Verbindingen die te lang stil hebben gestaan, worden actief gesloten
    // in plaats van "hangend" te blijven — TiDB Cloud sluit langdurig
    // inactieve verbindingen aan hun kant ook al af.
    idleTimeout: 60_000,
  });

  return pool;
}

export interface NewOrderRow {
  shapeId: string;
  shapeName: string;
  finish: "vlak" | "gewelfd";
  colorId: string;
  colorName: string;
  sizeId: string;
  sizeName: string;
  fontId: string;
  fontName: string;
  customText: string;
  extraLine1: string | null;
  extraLine2: string | null;
  numberPosition: "start" | "middle" | "end";
  priceTotalCents: number | null;
  priceColorSurchargeCents: number;
  priceExtraCharsCents: number;
  priceExtraCharsCount: number;
  priceSource: "prijstool" | "reservekopie";
  contactName: string;
  contactAddress: string;
  contactPostalCode: string;
  contactCity: string;
  contactEmail: string;
  contactPhone: string | null;
  quantity: string;
}

/**
 * Slaat een bevestigde configuratie (bestelling) op in de MySQL-database.
 * Wordt aangeroepen vanuit app/api/send-email/route.ts, NA het succesvol
 * versturen van de interne meldingsmail. Gooit fouten door naar de
 * aanroeper — die beslist zelf of dat de rest van het verzoek mag
 * beïnvloeden (op dit moment: nee, een mislukte database-opslag mag een
 * bestelling nooit blokkeren, zie het commentaar daar).
 */
export async function saveOrderToDatabase(order: NewOrderRow): Promise<void> {
  const db = getPool();
  await db.execute(
    `INSERT INTO configurations (
      shape_id, shape_name, finish, color_id, color_name, size_id, size_name,
      font_id, font_name, custom_text, extra_line_1, extra_line_2, number_position,
      price_total_cents, price_color_surcharge_cents, price_extra_chars_cents,
      price_extra_chars_count, price_source,
      contact_name, contact_address, contact_postal_code, contact_city,
      contact_email, contact_phone, quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.shapeId,
      order.shapeName,
      order.finish,
      order.colorId,
      order.colorName,
      order.sizeId,
      order.sizeName,
      order.fontId,
      order.fontName,
      order.customText,
      order.extraLine1,
      order.extraLine2,
      order.numberPosition,
      order.priceTotalCents,
      order.priceColorSurchargeCents,
      order.priceExtraCharsCents,
      order.priceExtraCharsCount,
      order.priceSource,
      order.contactName,
      order.contactAddress,
      order.contactPostalCode,
      order.contactCity,
      order.contactEmail,
      order.contactPhone,
      order.quantity,
    ]
  );
}
