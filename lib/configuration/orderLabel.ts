// Duitse vertaling van de tekst hieronder — zelfde soort eigen, niet door
// Christiaan geverifieerde vertaling als de andere Duitse labels in
// lib/email/templates/configuration-confirmation.ts (labelBaseColor,
// labelShipping, enz.). Christiaan kan dit laten corrigeren.
const ORDER_LABEL_TEXT = {
  nl: {
    oneLineEnd: "Tekstregel boven, huisnummer onder",
    oneLineElse: "Huisnummer boven, tekstregel onder",
    twoLinesMiddle: "Tekstregel 1 boven, huisnummer midden, tekstregel 2 onder",
    twoLinesEnd: "Tekstregel 1 boven, tekstregel 2 midden, huisnummer onder",
    twoLinesElse: "Huisnummer boven, tekstregel 1 midden, tekstregel 2 onder",
  },
  de: {
    oneLineEnd: "Textzeile oben, Hausnummer unten",
    oneLineElse: "Hausnummer oben, Textzeile unten",
    twoLinesMiddle: "Textzeile 1 oben, Hausnummer mitte, Textzeile 2 unten",
    twoLinesEnd: "Textzeile 1 oben, Textzeile 2 mitte, Hausnummer unten",
    twoLinesElse: "Hausnummer oben, Textzeile 1 mitte, Textzeile 2 unten",
  },
} as const;

/**
 * Bouwt de mensleesbare "Volgorde"/"Reihenfolge"-tekst (bv. "Huisnummer
 * boven, tekstregel onder") die laat zien in welke volgorde het huisnummer
 * en de eventuele tekstregel(s) op het bordje komen te staan. Wordt gebruikt
 * in zowel de "Controle"-stap van de configurator (components/configurator/
 * ConfigurationSummary.tsx, altijd Nederlands — geen `language`-argument
 * nodig daar) als in de interne bevestigingsmail
 * (lib/email/sendPaidOrderEmails.ts, sinds 29-8-2026) — één plek, zodat de
 * tekst overal hetzelfde is. Bij een vorm zonder extra tekstregel is er
 * niets te ordenen, dus dan geeft deze functie undefined terug (geen
 * "Volgorde"-regel nodig).
 *
 * `language` (toegevoegd 25-9-2026, n.a.v. een screenshot van Christiaan
 * waarop deze tekst in de Duitse interne mail nog onvertaald "Tekstregel 1
 * boven, huisnummer midden, tekstregel 2 onder" toonde): het bijbehorende
 * label ("Volgorde"/"Reihenfolge") was al vertaald in
 * lib/email/templates/configuration-confirmation.ts — alleen deze
 * gegenereerde WAARDE zelf niet, want die kwam hier altijd hardcoded in het
 * Nederlands uit. Standaard "nl" (ongewijzigd gedrag voor elke aanroep die
 * dit argument niet meegeeft, zoals ConfigurationSummary.tsx).
 */
export function buildOrderLabel(
  shape: { extraLines: number },
  position: "start" | "middle" | "end",
  language: "nl" | "de" = "nl"
): string | undefined {
  const t = ORDER_LABEL_TEXT[language];
  if (shape.extraLines === 0) return undefined;
  if (shape.extraLines === 1) {
    return position === "end" ? t.oneLineEnd : t.oneLineElse;
  }
  if (position === "middle") return t.twoLinesMiddle;
  if (position === "end") return t.twoLinesEnd;
  return t.twoLinesElse;
}
