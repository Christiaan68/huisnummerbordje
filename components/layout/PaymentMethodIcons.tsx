import { CreditCard, Landmark, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toont welke betaalmethodes de webshop via Mollie aanbiedt — op verzoek
 * van Christiaan (31-8-2026) bewust beperkt tot precies deze 3: iDEAL,
 * creditcard en Apple Pay (zie ook de `method`-beperking op de
 * betaalaanroep in app/api/create-payment/route.ts, die ervoor zorgt dat
 * Mollie's eigen betaalpagina ook daadwerkelijk alleen deze 3 laat zien —
 * deze twee plekken horen dus bij elkaar te blijven passen).
 *
 * Bewust GEEN officiële merklogo's (het officiële iDEAL-beeldmerk, de
 * Visa-/Mastercard-logo's, of Apple's eigen "Apple Pay"-beeldmerk) —
 * die vereisen de exacte, door elke merkhouder zelf aangeleverde
 * beeldbestanden en strikte huisstijlregels (vooral Apple stelt hier
 * strenge eisen aan hoe hun merk gebruikt mag worden). In plaats daarvan:
 * een neutraal icoontje uit dezelfde lucide-icoonset die de rest van de
 * configurator al gebruikt (bv. de "Terug"-knoppen), gecombineerd met de
 * naam in tekst — duidelijk leesbaar voor de klant, zonder risico op een
 * onjuist gebruikt beeldmerk. Mocht je hier later de échte, officiële
 * icoontjes voor willen, dan kan dat door de bestanden uit Mollie's eigen
 * downloadpakket (mollie.com/resources) aan te leveren.
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
  { icon: Landmark, label: "iDEAL" },
  { icon: CreditCard, label: "Creditcard" },
  { icon: Wallet, label: "Apple Pay" },
] as const;

export function PaymentMethodIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
