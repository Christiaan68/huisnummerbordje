import { z } from "zod";

/**
 * Server- én client-side validatie voor het "vraag stellen"-formulier.
 * Dit formulier verschijnt als pop-up op de configuratorstap "Controle",
 * zowel bij het bevestigen van de configuratie als bij het bevestigen van
 * de contactgegevens — zodat een bezoeker op elk van die twee momenten
 * een vraag kan stellen, met zijn gekozen configuratie erbij.
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
});

export type QuestionDetails = z.infer<typeof questionDetailsSchema>;
