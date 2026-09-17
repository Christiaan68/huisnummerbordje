import mysql from "mysql2/promise";

/**
 * Verbinding met de MySQL-database (TiDB Cloud) waarin elke bestelling
 * bewaard wordt, al vanaf het moment dat de klant naar Mollie doorgestuurd
 * wordt (zie app/api/create-payment/route.ts en app/api/mollie-webhook/
 * route.ts, sinds 29-8-2026).
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
  // colorId/colorName: de ENE kleur voor de 4 oorspronkelijke vormen
  // (colorMode "single"). Sinds 9-9-2026 (uitbreiding naar 7 vormen, zie
  // config/product-options.ts) `string | null` in plaats van verplicht
  // `string`: voor de 3 nieuwe "oren"-vormen (colorMode "ears-and-plate")
  // worden deze twee juist NULL meegegeven, en zijn earColorId/earColorName/
  // plateColorId/plateColorName hieronder gevuld — nooit allebei tegelijk.
  // Zie database/mysql/orders-schema.sql (migratie 9-9-2026) voor de
  // bijbehorende ALTER TABLE die color_id/color_name NULL-baar maakt.
  colorId: string | null;
  colorName: string | null;
  // printColorId/printColorName ("Opdruk kleur", toegevoegd 16-9-2026):
  // tweede, verplichte kleur naast colorId/colorName ("Ondergrond kleur")
  // hierboven, alleen voor colorMode "single"-vormen — blijft `null` voor de
  // 3 "oren"-vormen. Zie database/mysql/orders-schema.sql (migratie
  // 16-9-2026) voor de eenmalige ALTER TABLE die deze 2 nieuwe kolommen
  // toevoegt.
  printColorId: string | null;
  printColorName: string | null;
  // earColorId/earColorName/plateColorId/plateColorName: TWEE losse,
  // allebei verplichte kleuren (oren + vlak) voor de 3 nieuwe "oren"-vormen
  // (colorMode "ears-and-plate", toegevoegd 9-9-2026) — uit de aparte
  // kleurenlijst productColorsOren (config/product-options.ts), nooit uit
  // dezelfde lijst als colorId/colorName. Blijven `null` voor de 4
  // oorspronkelijke vormen. Zie database/mysql/orders-schema.sql (migratie
  // 9-9-2026) voor de eenmalige ALTER TABLE die deze 4 nieuwe, optionele
  // kolommen toevoegt.
  earColorId: string | null;
  earColorName: string | null;
  plateColorId: string | null;
  plateColorName: string | null;
  sizeId: string;
  sizeName: string;
  // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype (zie
  // types/configuration.ts). De database-kolommen heten nog steeds
  // font_id/font_name (zie saveOrderToDatabase hieronder) — dat blijft zo
  // om geen bestaande, al bevestigde bestellingen in de tabel te hoeven
  // hernoemen; ze bevatten voortaan gewoon het lettertype van het
  // HUISNUMMER. line1FontId/line1FontName en line2FontId/line2FontName
  // zijn nieuwe, optionele kolommen (alleen gevuld als de gekozen vorm die
  // tekstregel heeft) — zie database/mysql/orders-schema.sql voor de
  // eenmalige ALTER TABLE-migratie die daarvoor nodig was.
  //
  // De 3 "oren"-vormen (toegevoegd 9-9-2026) kennen geen lettertypekeuze
  // (hasFontChoice: false, zie types/product.ts) — numberFontId/
  // numberFontName blijven voor die vormen bewust `""` (leeg), in plaats
  // van deze twee kolommen ook NULL-baar te maken: dat zou de bestaande
  // NOT NULL-eis op font_id/font_name voor alle andere (bestaande) vormen
  // onnodig verzwakken voor een verandering die alleen de 3 nieuwe vormen
  // raakt. Eigen keuze — zie het rapport van deze wijziging.
  numberFontId: string;
  numberFontName: string;
  line1FontId: string | null;
  line1FontName: string | null;
  line2FontId: string | null;
  line2FontName: string | null;
  customText: string;
  extraLine1: string | null;
  extraLine2: string | null;
  numberPosition: "start" | "middle" | "end";
  hasFrame: boolean;
  priceTotalCents: number | null;
  priceColorSurchargeCents: number;
  priceExtraCharsCents: number;
  priceExtraCharsCount: number;
  priceFrameSurchargeCents: number;
  // Leveringskosten (toegevoegd 17-9-2026) — vervoerder + verzendstaffel +
  // prijs, volledig bepaald door de prijsbeheeromgeving op basis van het
  // gekozen product/maat (zie lib/configuration/pricing.ts). `null` kan in
  // de praktijk niet voorkomen op het moment dat een bestelling hier
  // opgeslagen wordt: app/api/create-payment/route.ts blokkeert de
  // betaling al eerder als er geen (geldige) koppeling is (zie
  // calculatePrice — "prijs op aanvraag"-pad) — toch hier `| null`
  // getypeerd, voor het (zeldzame) geval van een heel oude bestelling of
  // een toekomstige aanroeper die dit veld nog niet meegeeft.
  shippingCarrierName: string | null;
  shippingTierName: string | null;
  shippingCostCents: number | null;
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
 * Slaat een configuratie (bestelling) op in de MySQL-database.
 *
 * Sinds de invoering van Mollie (29-8-2026) gebeurt dit AL zodra de klant
 * naar de betaalpagina van Mollie doorgestuurd wordt (zie
 * app/api/create-payment/route.ts) — dus nog vóór er daadwerkelijk betaald
 * is. De nieuwe kolom payment_status staat dan op 'pending' (de standaard-
 * waarde, zie database/mysql/orders-schema.sql). Pas zodra Mollie via de
 * webhook (app/api/mollie-webhook/route.ts) een gelukte betaling bevestigt,
 * gaan de bevestigingsmails ook echt uit en wordt de rij op 'paid' gezet
 * (zie markOrderAsPaid hieronder). Vóór Mollie gebeurde dit allemaal in één
 * keer, ná het versturen van de mails — vandaar dat deze functie nu (in
 * tegenstelling tot vroeger) het nieuw aangemaakte rij-id teruggeeft: dat
 * id is nodig om de bestelling later, bij de webhook, weer terug te vinden.
 */
export async function saveOrderToDatabase(order: NewOrderRow): Promise<number> {
  const db = getPool();
  const [result] = (await db.execute(
    `INSERT INTO configurations (
      shape_id, shape_name, finish, color_id, color_name,
      print_color_id, print_color_name,
      ear_color_id, ear_color_name, plate_color_id, plate_color_name,
      size_id, size_name,
      font_id, font_name, line1_font_id, line1_font_name, line2_font_id, line2_font_name,
      custom_text, extra_line_1, extra_line_2, number_position,
      has_frame,
      price_total_cents, price_color_surcharge_cents, price_extra_chars_cents,
      price_extra_chars_count, price_frame_surcharge_cents,
      shipping_carrier_name, shipping_tier_name, shipping_cost_cents,
      price_source,
      contact_name, contact_address, contact_postal_code, contact_city,
      contact_email, contact_phone, quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.shapeId,
      order.shapeName,
      order.finish,
      order.colorId,
      order.colorName,
      order.printColorId,
      order.printColorName,
      order.earColorId,
      order.earColorName,
      order.plateColorId,
      order.plateColorName,
      order.sizeId,
      order.sizeName,
      order.numberFontId,
      order.numberFontName,
      order.line1FontId,
      order.line1FontName,
      order.line2FontId,
      order.line2FontName,
      order.customText,
      order.extraLine1,
      order.extraLine2,
      order.numberPosition,
      order.hasFrame,
      order.priceTotalCents,
      order.priceColorSurchargeCents,
      order.priceExtraCharsCents,
      order.priceExtraCharsCount,
      order.priceFrameSurchargeCents,
      order.shippingCarrierName,
      order.shippingTierName,
      order.shippingCostCents,
      order.priceSource,
      order.contactName,
      order.contactAddress,
      order.contactPostalCode,
      order.contactCity,
      order.contactEmail,
      order.contactPhone,
      order.quantity,
    ]
  )) as unknown as [{ insertId: number }, unknown];
  return result.insertId;
}

/**
 * Zet, meteen na het aanmaken van de betaling bij Mollie (zie
 * app/api/create-payment/route.ts), Mollie's eigen kenmerk van de betaling
 * op de net aangemaakte bestelling — zodat de webhook straks, als Mollie
 * alleen dat kenmerk teruggeeft, de bijbehorende bestelling kan terugvinden.
 */
export async function setOrderMolliePaymentId(
  orderId: number,
  molliePaymentId: string
): Promise<void> {
  const db = getPool();
  await db.execute(
    "UPDATE configurations SET mollie_payment_id = ? WHERE id = ?",
    [molliePaymentId, orderId]
  );
}

/**
 * Zet een bestelling op 'paid' zodra Mollie (via de webhook) een gelukte
 * betaling bevestigt, en registreert het moment daarvan.
 *
 * paymentMethodName/paymentBankName (toegevoegd 16-9-2026, op verzoek van
 * Christiaan) komen rechtstreeks van Mollie (zie getPaymentMethodLabel/
 * getBankName in lib/mollie/client.ts) en worden bewaard zodat het
 * beheertool ze in het orderoverzicht kan tonen — banknaam is optioneel
 * (`null` als Mollie 'm niet meegeeft, bv. bij creditcard).
 */
export async function markOrderAsPaid(
  orderId: number,
  molliePaymentId: string,
  paymentMethodName?: string | null,
  paymentBankName?: string | null
): Promise<void> {
  const db = getPool();
  await db.execute(
    "UPDATE configurations SET payment_status = 'paid', mollie_payment_id = ?, paid_at = NOW(), payment_method_name = ?, payment_bank_name = ? WHERE id = ?",
    [molliePaymentId, paymentMethodName ?? null, paymentBankName ?? null, orderId]
  );
}

/**
 * Zet een bestelling op 'failed'/'expired'/'canceled' zodra Mollie (via de
 * webhook) zo'n eindstatus bevestigt. Er gaan in deze gevallen nooit
 * bevestigingsmails uit.
 *
 * paymentMethodName/paymentBankName/paymentFailureReason (toegevoegd
 * 16-9-2026, zie markOrderAsPaid hierboven): dezelfde herkomst (Mollie
 * zelf, via lib/mollie/client.ts). paymentFailureReason blijft `null` als
 * Mollie zelf geen reden meegeeft — er wordt hier nooit een reden verzonnen.
 */
export async function updateOrderPaymentStatus(
  orderId: number,
  status: "failed" | "expired" | "canceled",
  molliePaymentId: string,
  paymentMethodName?: string | null,
  paymentBankName?: string | null,
  paymentFailureReason?: string | null
): Promise<void> {
  const db = getPool();
  await db.execute(
    "UPDATE configurations SET payment_status = ?, mollie_payment_id = ?, payment_method_name = ?, payment_bank_name = ?, payment_failure_reason = ? WHERE id = ?",
    [
      status,
      molliePaymentId,
      paymentMethodName ?? null,
      paymentBankName ?? null,
      paymentFailureReason ?? null,
      orderId,
    ]
  );
}

export interface OrderRow {
  id: number;
  shape_id: string;
  shape_name: string;
  finish: "vlak" | "gewelfd";
  // Sinds 9-9-2026 (uitbreiding naar 7 vormen) `string | null` — zie
  // NewOrderRow hierboven voor de volledige toelichting: NULL voor de 3
  // "oren"-vormen (colorMode "ears-and-plate"), die in plaats daarvan
  // ear_color_id/ear_color_name/plate_color_id/plate_color_name gebruiken.
  color_id: string | null;
  color_name: string | null;
  print_color_id: string | null;
  print_color_name: string | null;
  ear_color_id: string | null;
  ear_color_name: string | null;
  plate_color_id: string | null;
  plate_color_name: string | null;
  size_id: string;
  size_name: string;
  font_id: string;
  font_name: string;
  line1_font_id: string | null;
  line1_font_name: string | null;
  line2_font_id: string | null;
  line2_font_name: string | null;
  custom_text: string;
  extra_line_1: string | null;
  extra_line_2: string | null;
  number_position: "start" | "middle" | "end";
  has_frame: number;
  price_total_cents: number | null;
  price_color_surcharge_cents: number;
  price_extra_chars_cents: number;
  price_extra_chars_count: number;
  price_frame_surcharge_cents: number;
  // Leveringskosten (toegevoegd 17-9-2026) — zie de toelichting bij
  // NewOrderRow hierboven.
  shipping_carrier_name: string | null;
  shipping_tier_name: string | null;
  shipping_cost_cents: number | null;
  price_source: "prijstool" | "reservekopie";
  contact_name: string;
  contact_address: string;
  contact_postal_code: string;
  contact_city: string;
  contact_email: string;
  contact_phone: string | null;
  quantity: string;
  status: string;
  payment_status: "pending" | "paid" | "failed" | "expired" | "canceled";
  mollie_payment_id: string | null;
  paid_at: string | null;
  // Toegevoegd 16-9-2026: zie markOrderAsPaid/updateOrderPaymentStatus
  // hierboven — blijven `null` zolang een bestelling nog 'pending' is.
  payment_method_name: string | null;
  payment_bank_name: string | null;
  payment_failure_reason: string | null;
  created_at: string;
}

/**
 * Haalt één bestelling op basis van het rij-id op — gebruikt door de
 * webhook (om de volledige configuratie terug te vinden zodra Mollie een
 * betaling bevestigt) en door de bedankpagina (om te tonen of de betaling
 * gelukt is). Geeft `null` terug als het id niet bestaat, in plaats van een
 * fout te gooien — de aanroeper beslist dan zelf hoe dat getoond wordt.
 */
export async function getOrderById(orderId: number): Promise<OrderRow | null> {
  const db = getPool();
  const [rows] = (await db.execute(
    "SELECT * FROM configurations WHERE id = ? LIMIT 1",
    [orderId]
  )) as unknown as [OrderRow[], unknown];
  return rows.length > 0 ? rows[0] : null;
}
