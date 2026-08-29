"use client";

import { useEffect } from "react";
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
 */
export function PendingPaymentAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.refresh();
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
