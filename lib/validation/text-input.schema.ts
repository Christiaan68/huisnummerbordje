import { z } from "zod";

/**
 * Validatie voor het huisnummer zelf (max. 5 tekens, op elke vorm).
 *
 * Stond eerst alleen letters/cijfers toe — op verzoek van Christiaan
 * (29-8-2026: "ik wil alle tekens kunnen gebruiken op de plek van het
 * huisnummer, ook deze bv o̲") nu verruimd naar VRIJWEL elk teken,
 * inclusief accenten, symbolen en Unicode-combinatietekens (zoals de
 * onderstrepings-combinatie in dat voorbeeld: een gewone "o" gevolgd door
 * een apart, onzichtbaar "voeg een liggend streepje toe"-teken). Net als
 * bij extraLineSchema hieronder blijft een klein aantal tekens bewust
 * UITGESLOTEN, niet omdat ze taalkundig ongewenst zijn, maar omdat
 * customText/extraLine1/2 zonder HTML-escaping direct in de
 * e-mailsjablonen terechtkomen (lib/email/templates/*.ts, platte
 * string-opbouw, geen React/JSX) — < > { } / \ en = zouden daar een
 * openstaande HTML-tag of attribuut kunnen injecteren.
 *
 * Let op voor een volgende sessie: de automatische tekstgrootte
 * (computeAutoFit, lib/configuration/text-fit.ts) telt tekens via
 * `.length` — een combinatieteken zoals hierboven telt daarbij gewoon mee
 * als een extra teken, ook al neemt het zelf geen extra breedte in. Bij
 * gebruik van zulke tekens kan de automatische grootte daardoor iets
 * voorzichtiger (kleiner) uitvallen dan strikt nodig — geen foutieve
 * werking, wel een nuance om te weten als daar ooit een vraag over komt.
 * Ook nog niet visueel gecontroleerd of de e-mailafbeelding (Satori/
 * next/og, lib/email/plate-preview-image.tsx) een combinatieteken net zo
 * goed samenvoegt met het basisteken als een gewone browser dat doet.
 */
export const houseNumberSchema = z
  .string()
  .trim()
  .min(1, "Vul een huisnummer in.")
  .max(5, "Maximaal 5 tekens toegestaan.")
  .regex(/^[^<>{}\\\/=]+$/u, "Dit teken is niet toegestaan.");

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
