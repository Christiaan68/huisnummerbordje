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
 * Root cause: een `<meta httpEquiv="refresh">`-tag is een timer die de
 * BROWSER zelf instelt op het moment dat de pagina voor het eerst geladen
 * wordt (bij een "echte" paginalading) — die timer blijft gewoon doortikken,
 * ook nadat je via een gewone link naar een andere pagina bent genavigeerd
 * binnen dezelfde webshop (dat gaat namelijk met Next.js' eigen, snellere
 * "client-side" navigatie, zonder dat de browser de pagina echt opnieuw
 * laadt/verlaat — en alleen bij een echte paginalading/verlating annuleert
 * de browser zo'n timer vanzelf). Na het verstrijken van de ingestelde tijd
 * stuurde de browser je daardoor alsnog naar de oude wachtpagina-URL,
 * ongeacht waar je intussen naartoe genavigeerd was.
 *
 * Oplossing: in plaats daarvan hier, met React, zelf een eenmalige
 * tijdklok instellen (`setTimeout`) die na 4 seconden alleen de gegevens
 * van déze pagina ververst (`router.refresh()` — haalt de betaalstatus
 * opnieuw op bij de server, zonder de hele pagina opnieuw te laden en
 * zonder de URL/geschiedenis te wijzigen) — en, cruciaal, die tijdklok
 * weer opruimt zodra deze component van het scherm verdwijnt (bv. omdat de
 * bezoeker wegnavigeert naar een andere pagina). Zolang de betaalstatus
 * 'pending' blijft, blijft de bedankt-pagina deze component tonen en start
 * elke ververste weergave vanzelf een nieuwe tijdklok voor de volgende 4
 * seconden — dat stopt vanzelf zodra de status niet meer 'pending' is (de
 * pagina toont deze component dan niet meer) of zodra de bezoeker
 * wegnavigeert (de opruimfunctie hieronder annuleert de lopende tijdklok).
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
 *
 * Het aantal keren verversen wordt bijgehouden in sessionStorage (niet in
 * React-state): deze component blijkt namelijk bij elke ververste weergave
 * opnieuw op te bouwen (zie hierboven), waardoor gewoon React-state elke
 * keer weer op nul zou beginnen. sessionStorage overleeft dat wel, en is
 * per bestelling (orderId) apart bijgehouden, zodat een andere/nieuwe
 * bestelling niet per ongeluk meteen met deze tekst begint.
 */
export function PendingPaymentAutoRefresh({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    try {
      const storageKey = `bedankt-pogingen-${orderId}`;
      const attempts = Number(sessionStorage.getItem(storageKey) ?? "0") + 1;
      sessionStorage.setItem(storageKey, String(attempts));
      if (attempts >= 2) {
        setShowSlowNotice(true);
      }
    } catch {
      // sessionStorage kan in zeldzame gevallen niet beschikbaar zijn (bv.
      // privénavigatie met strikte instellingen) — dan laten we de extra
      // regel gewoon achterwege, de rest (verversen) blijft gewoon werken.
    }

    const timer = setTimeout(() => {
      router.refresh();
    }, 4000);

    return () => clearTimeout(timer);
  }, [router, orderId]);

  if (!showSlowNotice) {
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
