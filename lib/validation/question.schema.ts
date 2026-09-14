import { z } from "zod";

/**
 * Server- én client-side validatie voor het "vraag stellen"-formulier.
 * Dit formulier verschijnt als pop-up op de configuratorstap "Controle",
 * zowel bij het bevestigen van de configuratie als bij het bevestigen van
 * de contactgegevens — zodat een bezoeker op elk van die twee momenten
 * een vraag kan stellen, met zijn gekozen configuratie erbij. Sinds
 * 14-9-2026 ook gebruikt door het algemene contactformulier op
 * /contact/vraag, incl. de nieuwe 8e "vorm"-tegel in stap 1 van de
 * configurator ("Weet je het nog niet?", zie ShapeSelector.tsx) die
 * rechtstreeks naar die pagina doorlinkt.
 *
 * phone/postalCode/houseNumber/street/city zijn BEWUST optioneel: alleen
 * naam en e-mailadres zijn verplicht, de rest is "fijn om te hebben" zodat
 * Christiaan bij het beantwoorden meteen de adresgegevens bij de hand heeft
 * (verzoek Christiaan, 14-9-2026), zonder dat een bezoeker die alleen een
 * korte vraag heeft gedwongen wordt dit allemaal in te vullen.
 */
export const questionDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vul je naam in.")
    .max(100, "Maximaal 100 tekens."),
  email: z
    .string()
    .trim()
    .min(1, "Vul je e-mailadres in.")
    .email("Vul een geldig e-mailadres in."),
  question: z
    .string()
    .trim()
    .min(1, "Vul je vraag in.")
    .max(1000, "Maximaal 1000 tekens."),
  phone: z
    .string()
    .trim()
    .max(30, "Maximaal 30 tekens.")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(val),
      "Vul een geldige postcode in (of laat dit veld leeg)."
    ),
  houseNumber: z
    .string()
    .trim()
    .max(10, "Maximaal 10 tekens.")
    .optional()
    .or(z.literal("")),
  street: z
    .string()
    .trim()
    .max(100, "Maximaal 100 tekens.")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100, "Maximaal 100 tekens.")
    .optional()
    .or(z.literal("")),
});

export type QuestionDetails = z.infer<typeof questionDetailsSchema>;
