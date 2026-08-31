"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Vervangt de eerdere `<meta httpEquiv="refresh">` op de bedankt-pagina
 * (app/bestelling/bedankt/page.tsx) — toegevoegd 29-8-2026, na een
 * bugmelding van Christiaan: als de betaling bij Mollie op "open" (nog niet
 * afgerond) bleef staan en hij vanaf de wachtpagina alsnog naar home ging of
 * opnieuw de configurator instapte, sprong hij na 1-2 seconden ONGEVRAAGD
 * terug naar die wachtpagina.
 *
 * Root cause (van die eerdere bug): een `<meta httpEquiv="refresh">`-tag is
 * een timer die de BROWSER zelf instelt op het moment dat de pagina voor
 * het eerst geladen wordt (bij een "echte" paginalading) — die timer blijft
 * gewoon doortikken, ook nadat je via een gewone link naar een andere
 * pagina bent genavigeerd binnen dezelfde webshop (dat gaat namelijk met
 * Next.js' eigen, snellere "client-side" navigatie, zonder dat de browser
 * de pagina echt opnieuw laadt/verlaat — en alleen bij een échte
 * paginalading/verlating annuleert de browser zo'n timer vanzelf). Na het
 * verstrijken van de ingestelde tijd stuurde de browser je daardoor alsnog
 * naar de oude wachtpagina-URL, ongeacht waar je intussen naartoe
 * genavigeerd was.
 *
 * Oplossing: in plaats daarvan hier, met React, zelf een tijdklok
 * instellen (`setTimeout`) die na 4 seconden alleen de gegevens van déze
 * pagina ververst (`router.refresh()` — haalt de betaalstatus opnieuw op
 * bij de server, zonder de hele pagina opnieuw te laden en zonder de
 * URL/geschiedenis te wijzigen).
 *
 * BUGFIX (31-8-2026, gevonden bij het uitzoeken van de Mollie-"blijft
 * hangen"-melding): de eerdere versie hier telde het aantal ververste
 * weergaves NIET bij in React-state, en herhaalde de tijdklok dus ook maar
 * ÉÉN KEER — na de allereerste 4 seconden werd er wél ververst, maar
 * daarna nooit meer, want er werd geen nieuwe tijdklok meer ingesteld
 * (React herbruikt deze component gewoon bij een ververste weergave, in
 * plaats van 'm opnieuw op te bouwen zoals eerder hier stond aangenomen).
 * Bij een normale, snel gelukte betaling viel dit niet op (één keer
 * verversen was toevallig al genoeg om de "betaald"-status op te pikken),
 * maar bij een betaling die langer op zich liet wachten (bijvoorbeeld een
 * mislukte/verlopen/geannuleerde poging bij Mollie) bleef de pagina daarna
 * voor altijd op "Betaling wordt verwerkt" staan, ook als de echte status
 * allang bekend was — de klant moest dan zelf de pagina verversen om de
 * juiste status alsnog te zien. Christiaan liep hier tegenaan: de eerdere
 * "extra regel na een paar keer verversen"-tekst verscheen daardoor ook
 * nooit, want er kwam nooit een 2e keer verversen.
 *
 * Nu bijgehouden via `attempts` in React-state, die zowel het aantal
 * ververste weergaves telt ALS (via de dependency-array van de effect)
 * zorgt dat er na elke ververste weergave weer een nieuwe tijdklok van 4
 * seconden wordt ingesteld — dit blijft zo doorgaan zolang de betaalstatus
 * 'pending' blijft (de bedankt-pagina toont deze component dan nog
 * steeds), en stopt vanzelf zodra de status definitief is (dan verdwijnt
 * deze component uit de pagina) of zodra de bezoeker wegnavigeert (de
 * opruimfunctie hieronder annuleert dan de lopende tijdklok).
 *
 * UITBREIDING (31-8-2026, op verzoek van Christiaan, na het Mollie-
 * uitzoekwerk rond "open"/"mislukt"/"verlopen"/"geannuleerd"): als een
 * betaalpoging niet gelukt is en de klant via Mollie's "Vorige pagina"-
 * linkje (of de browser-terugknop) hierheen terugkeert, kan het — bij
 * meerdere toegestane betaalmethodes, zie method-array in
 * app/api/create-payment/route.ts — tot de volle, normale verlooptijd van
 * de gekozen methode duren (bij iDEAL bijvoorbeeld 15 minuten) voordat
 * Mollie dat ook echt definitief doorgeeft. Bewust NIET meteen bij de
 * eerste weergave al een waarschuwende tekst tonen (de meeste betalingen
 * zijn namelijk gewoon binnen een paar seconden klaar) — pas vanaf de 2e
 * keer verversen (dus na zo'n 8 seconden) verschijnt onderstaande extra
 * regel, zodat een klant bij een normale, snelle bevestiging niets van
 * deze tekst merkt, en 'm alleen ziet als het daadwerkelijk langer duurt.
 */
export function PendingPaymentAutoRefresh() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAttempts((current) => current + 1);
      router.refresh();
    }, 4000);

    return () => clearTimeout(timer);
  }, [router, attempts]);

  if (attempts < 2) {
    return null;
  }

  return (
    <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
      Duurt dit langer dan verwacht? Dat kan gebeuren als een betaalpoging
      niet is gelukt, verlopen of geannuleerd is — dat wordt door de bank of
      betaalmethode soms pas na een paar minuten definitief bevestigd. Je
      hoeft niets te doen, we blijven het voor je checken.
    </p>
  );
}
