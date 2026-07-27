import { z } from "zod";

/**
 * Server- én client-side validatie voor de contactgegevens die na
 * bevestiging van de configuratie worden gevraagd, vóór het versturen
 * van de e-mail.
 */
export const contactDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vul je naam in.")
    .max(100, "Maximaal 100 tekens."),
  address: z
    .string()
    .trim()
    .min(1, "Vul je adres in.")
    .max(150, "Maximaal 150 tekens."),
  city: z
    .string()
    .trim()
    .min(1, "Vul je woonplaats in.")
    .max(100, "Maximaal 100 tekens."),
  email: z
    .string()
    .trim()
    .min(1, "Vul je e-mailadres in.")
    .email("Vul een geldig e-mailadres in."),
  phone: z
    .string()
    .trim()
    .max(30, "Maximaal 30 tekens.")
    .optional()
    .or(z.literal("")),
});

export type ContactDetails = z.infer<typeof contactDetailsSchema>;
