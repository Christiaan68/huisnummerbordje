import {
  splitHouseNumberSegments,
  HOUSE_NUMBER_SUPERSCRIPT_RATIO,
} from "@/lib/configuration/plate-visual";

/**
 * Toont een huisnummer met de letter(s) erachter als superscript (bv. "12A"
 * → "12" gewoon groot, "A" kleiner en boven uitgelijnd) — puur presentatie,
 * de opgeslagen/verzonden tekst (customText) blijft altijd de volledige,
 * platte string. Zie de toelichting bij splitHouseNumberSegments in
 * lib/configuration/plate-visual.ts. Gedeeld door ConfigurationSummary.tsx
 * (configuratorstap "Controle") en PaymentIssueContact.tsx (orderoverzicht
 * op de bedankt-pagina) — de enige 2 plekken waar het huisnummer als gewone
 * (niet-HTML) React-tekst getoond wordt. Toegevoegd 25-9-2026.
 */
export function HouseNumberDisplay({ text }: { text: string }) {
  const segments = splitHouseNumberSegments(text);
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-start" }}>
      {segments.map((segment, index) =>
        segment.isLetters ? (
          <span key={index} style={{ fontSize: `${HOUSE_NUMBER_SUPERSCRIPT_RATIO}em` }}>
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}
