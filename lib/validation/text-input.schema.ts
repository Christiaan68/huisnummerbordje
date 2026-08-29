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

export type HouseNumberValue = z.infer<typeof houseNumberSchema>;
export type ExtraLineValue = z.infer<typeof extraLineSchema>;
