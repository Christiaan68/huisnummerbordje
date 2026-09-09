import { z } from "zod";

/**
 * Validatie voor het huisnummer zelf (max. 2 tekens, op elke vorm).
 * Alleen letters en cijfers — bij 2 tekens is er geen ruimte voor
 * leestekens en blijft dit veld puur het nummer (evt. met een letter,
 * zoals "12" of "3A").
 *
 * Op 29-8-2026 kort verruimd naar vrijwel alle tekens (op verzoek van
 * Christiaan, i.v.m. Unicode-combinatietekens zoals "o̲") en dezelfde dag
 * weer teruggedraaid naar deze oorspronkelijke, strengere versie.
 */
export const houseNumberSchema = z
  .string()
  .trim()
  .min(1, "Vul een huisnummer in.")
  .max(5, "Maximaal 5 tekens toegestaan.")
  .regex(/^[a-zA-Z0-9]+$/, "Alleen letters en cijfers zijn toegestaan.");

/**
 * Validatie voor een extra tekstregel (max. 20 tekens), gebruikt bij de
 * vormen "Huisnummer vierhoek + 1 regel" en "Huisnummer vierhoek + 2 regels".
 *
 * Toegestaan: letters (incl. accenten zoals ë, ï, é), cijfers, spaties en
 * gangbare leestekens (. , ' " - & ! ? : ;). Bewust UITGESLOTEN blijven
 * tekens die voor onveilige HTML-injectie gebruikt kunnen worden, zoals
 * < > { } / \ en =.
 */
export const extraLineSchema = z
  .string()
  .trim()
  .max(20, "Maximaal 20 tekens toegestaan.")
  .regex(
    /^[a-zA-ZÀ-ÿ0-9\s.,'"!?:;&()-]*$/,
    "Dit teken is niet toegestaan."
  );

/**
 * Validatie voor het huisnummerveld van de 3 nieuwe "oren"-vormen (jaren-30-
 * stijl met bevestigingsogen, toegevoegd 9-9-2026 — zie
 * config/product-options.ts, colorMode "ears-and-plate"). Andere regels dan
 * `houseNumberSchema` hierboven (die voor de 4 oorspronkelijke vormen
 * volledig ongewijzigd blijft):
 *
 * - Verplicht (mag niet leeg zijn).
 * - Minimaal 1, maximaal 4 CIJFERS.
 * - Optioneel aansluitend maximaal 3 extra LETTERS, die niet meetellen in
 *   de cijferlimiet van 4.
 *
 * Geldig: "1", "12", "1234", "12A", "176ABC". Ongeldig: "" (leeg), "12345"
 * (5 cijfers), "1ABCD" (4 letters).
 *
 * AANNAME (niet expliciet gespecificeerd door de klant, dus hier
 * gedocumenteerd zodat Christiaan dit kan corrigeren als hij een andere
 * volgorde/positie bedoelde): de regex hieronder eist "cijfers eerst, dan
 * letters" (bv. "12A"), niet "letters eerst" (bv. "A12") en niet losse
 * letters vóór én na de cijfers. Dit is de meest voor de hand liggende
 * lezing voor een huisnummer met een toevoeging (zoals "12A" in plaats van
 * "A12"), en is analoog aan hoe huisnummertoevoegingen in Nederlandse
 * adressen gebruikelijk genoteerd worden.
 */
export const houseNumberEarsSchema = z
  .string()
  .trim()
  .min(1, "Vul een huisnummer in.")
  .regex(
    /^[0-9]{1,4}[a-zA-Z]{0,3}$/,
    "Vul 1 t/m 4 cijfers in, eventueel gevolgd door maximaal 3 letters (bv. 12, 1234 of 12A)."
  );

export type HouseNumberValue = z.infer<typeof houseNumberSchema>;
export type HouseNumberEarsValue = z.infer<typeof houseNumberEarsSchema>;
export type ExtraLineValue = z.infer<typeof extraLineSchema>;
