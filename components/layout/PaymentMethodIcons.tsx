import { cn } from "@/lib/utils";

/**
 * Toont welke betaalmethodes de webshop via Mollie aanbiedt — op verzoek
 * van Christiaan (31-8-2026) beperkt tot de methodes die daadwerkelijk in
 * zijn Mollie-account geactiveerd staan (zie ook de `method`-beperking op
 * de betaalaanroep in app/api/create-payment/route.ts, die ervoor zorgt
 * dat Mollie's eigen betaalpagina ook daadwerkelijk dezelfde methodes
 * laat zien — deze twee plekken horen dus bij elkaar te blijven passen).
 *
 * "Apple Pay" staat hier BEWUST nog niet bij: dat kan Christiaan pas
 * activeren zodra zijn Mollie-account volledig gevalideerd is. Zodra dat
 * zo is, hier een { src: "/images/payment-methods/applepay.svg", alt:
 * "Apple Pay" }-entry toevoegen (en "applepay" aan de `method`-array in
 * app/api/create-payment/route.ts) — het bijbehorende icoontje staat dan
 * ook nog in hetzelfde "squircle"-formaat te downloaden bij
 * mollie.com/resources.
 *
 * De icoontjes zelf (public/images/payment-methods/*.svg) zijn de
 * officiële "squircle"-iconen uit Mollie's eigen downloadpakket
 * (mollie.com/resources — Christiaan heeft ze zelf gedownload en
 * aangeleverd, 31-8-2026), inclusief het huidige "iDEAL | Wero"-beeldmerk
 * (iDEAL is sinds 29 januari 2026 samengegaan met het Europese
 * betaalmerk Wero). Elk icoontje is al een compleet, afgerond blokje met
 * eigen achtergrondkleur — vandaar geen extra rand/tekstlabel eromheen
 * (dat zou dubbelop zijn).
 *
 * Gebruikt op 2 plekken: in de footer (components/layout/Footer.tsx, op
 * elke pagina zichtbaar als algemene geruststelling) en vlak boven de
 * "Doorgaan naar betalen"-knop (components/configurator/
 * ContactDetailsForm.tsx, op het moment dat het er echt toe doet). De rij
 * icoontjes "wrapt" vanzelf naar een 2e regel op een smal scherm
 * (`flex-wrap`), dus geen aparte aanpak nodig voor telefoon/tablet t.o.v.
 * laptop.
 */
const PAYMENT_METHODS = [
  { src: "/images/payment-methods/ideal.svg", alt: "iDEAL" },
  { src: "/images/payment-methods/creditcard.svg", alt: "Creditcard" },
] as const;

export function PaymentMethodIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PAYMENT_METHODS.map(({ src, alt }) => (
        // eslint-disable-next-line @next/next/no-img-element -- zelfde
        // aanpak als elders in de site (bv. app/contact/page.tsx): een
        // gewone <img> voor een klein, statisch icoontje, zonder de
        // overhead van next/image's optimalisatie-pijplijn.
        <img key={alt} src={src} alt={alt} className="h-8 w-8 rounded-[7px]" />
      ))}
    </div>
  );
}
