/**
 * Afzenders en reply-to-adres voor alle mails naar klanten (toegevoegd
 * 12-10-2026, op verzoek van Christiaan).
 *
 * Twee soorten afzenders:
 * - "orders": alles rond een bestelling naar de klant (bevestiging van de
 *   bestelling, melding verlopen/mislukte betaling) — bedoeld:
 *   Emaillehuisnummerbord.nl <bestellingen@emaillehuisnummerbord.nl>
 * - "info": alles rond een vraag vanuit de webshop (configurator, losse
 *   contactpagina, vraag over een bestelling) — bedoeld:
 *   Emaillehuisnummerbord.nl <info@emaillehuisnummerbord.nl>
 *
 * Antwoordt een klant op zo'n mail, dan komt dat bij het reply-to-adres
 * (bedoeld: info@langcat.nl), want op de afzenderadressen zelf wordt niet
 * gelezen.
 *
 * De adressen staan NIET vast in de code maar in environment variables
 * (MAIL_FROM_ORDERS, MAIL_FROM_INFO, MAIL_REPLY_TO), omdat Resend alleen
 * vanaf een geverifieerd domein verstuurt. Zijn ze niet ingesteld, dan
 * valt alles terug op het bestaande gedrag: afzender RESEND_FROM_EMAIL (of
 * onboarding@resend.dev) en geen aparte reply-to — zo kan deze code veilig
 * live gaan vóórdat het nieuwe domein in Resend geverifieerd is, en wordt de
 * omschakeling later alleen een kwestie van de variabelen in Vercel zetten
 * en opnieuw deployen.
 *
 * De weergegeven naam (voor het adres) is altijd "Emaillehuisnummerbord.nl".
 */

export type SenderKind = "orders" | "info";

const SENDER_NAME = "Emaillehuisnummerbord.nl";

function getSenderAddress(kind: SenderKind): string {
  const specific =
    kind === "orders" ? process.env.MAIL_FROM_ORDERS : process.env.MAIL_FROM_INFO;
  return (
    specific?.trim() || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  );
}

/** Voor het "from"-veld van Resend, bv. `Emaillehuisnummerbord.nl <info@...>`. */
export function getSenderFrom(kind: SenderKind): string {
  return `${SENDER_NAME} <${getSenderAddress(kind)}>`;
}

/**
 * Reply-to voor mails die naar een KLANT gaan. `undefined` als MAIL_REPLY_TO
 * niet is ingesteld (dan verandert er niets t.o.v. eerder).
 * Niet gebruiken voor interne meldingen aan Christiaan zelf: daar hoort het
 * adres van de klant als reply-to (zodat hij direct kan antwoorden).
 */
export function getCustomerReplyTo(): string | undefined {
  return process.env.MAIL_REPLY_TO?.trim() || undefined;
}
