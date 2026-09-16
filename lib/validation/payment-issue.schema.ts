import { z } from "zod";

/**
 * Validatie voor de pop-up "Vraag over je bestelling" op de bedankt-pagina
 * (zie components/order/PaymentIssueContact.tsx en
 * app/api/payment-issue/route.ts) — toegevoegd 16-9-2026, op verzoek van
 * Christiaan, voor bezoekers van wie de betaling nog verwerkt wordt (of
 * langer duurt dan verwacht) en die daarover een vraag willen stellen.
 *
 * Anders dan het bestaande "vraag stellen"-formulier (lib/validation/
 * question.schema.ts) zijn naam/e-mail/adres hier NIET nodig als los veld:
 * die staan al vast in de bestelling zelf. De pop-up stuurt daarom alleen
 * het ordernummer en de vraag zelf mee — app/api/payment-issue/route.ts
 * haalt de rest (naam, adres, configuratie, prijs, betaalstatus) zelf
 * opnieuw op uit de database, nooit vertrouwend op wat de browser meestuurt.
 */
export const paymentIssueQuestionSchema = z.object({
  orderId: z
    .number({ invalid_type_error: "Ongeldig ordernummer." })
    .int("Ongeldig ordernummer.")
    .positive("Ongeldig ordernummer."),
  question: z
    .string()
    .trim()
    .min(1, "Vul je vraag in.")
    .max(1000, "Maximaal 1000 tekens."),
});

export type PaymentIssueQuestion = z.infer<typeof paymentIssueQuestionSchema>;
