/**
 * Simpele formaatcheck (geen zod, geen netwerkcheck) voor een e-mailadres
 * dat rechtstreeks in een e-mailheader (From) terechtkomt — voorkomt dat
 * een leeg/kapot ingevuld adres uit een beheertool-instelling in de header
 * belandt.
 */
export function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Bepaalt het zichtbare afzenderadres voor een notificatiemail waarvan het
 * "aan"-adres een beheerder in de prijstool instelt (order_notification /
 * payment_issue_notification / question_notification).
 *
 * Toegevoegd 24-9-2026, ná een terechte correctie van Christiaan: het
 * ingestelde adres rechtstreeks als From gebruiken (eerdere versie) laat
 * het versturen mislukken zodra iemand daar een adres invult op een domein
 * dat niet bij Resend geverifieerd is (Resend accepteert alleen een From op
 * een geverifieerd domein). RESEND_FROM_EMAIL staat wél altijd op een
 * geverifieerd domein — dat versturen daarmee al jaren werkt, bewijst dat.
 *
 * Daarom: gebruik het ingestelde adres als From ALLEEN als het op hetzelfde
 * domein staat als RESEND_FROM_EMAIL (dus normaliter gewoon tenhaaken.nl —
 * geen domeinnaam hardcoded, dit wordt afgeleid van RESEND_FROM_EMAIL
 * zelf). Staat het ingestelde adres op een ander domein (bijvoorbeeld per
 * ongeluk een gmail-adres), val dan terug op RESEND_FROM_EMAIL zelf, zodat
 * versturen nooit kan mislukken door een niet-geverifieerd domein.
 */
export function resolveNotificationFromAddress(
  configuredEmail: string,
  fromAddress: string
): string {
  if (!isValidEmailFormat(configuredEmail) || !isValidEmailFormat(fromAddress)) {
    return fromAddress;
  }
  const configuredDomain = configuredEmail.split("@")[1]?.toLowerCase();
  const verifiedDomain = fromAddress.split("@")[1]?.toLowerCase();
  return configuredDomain === verifiedDomain ? configuredEmail : fromAddress;
}
