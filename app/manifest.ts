import type { MetadataRoute } from "next";

/**
 * Minimaal web-manifest (31-8-2026, op verzoek van Christiaan), puur zodat
 * Android/Chrome bij "Toevoegen aan startscherm" het eigen icoon van de
 * webshop gebruikt (het bordje met "39") in plaats van een automatisch
 * gegenereerde schermafbeelding. Next.js herkent dit bestand automatisch
 * (bestandsnaam `app/manifest.ts`) en voegt zelf de juiste `<link
 * rel="manifest">`-tag toe — daar hoeft verder niets voor aangepast te
 * worden in app/layout.tsx.
 *
 * BEWUST minimaal gehouden, geen "uitgebreide PWA": geen service worker,
 * geen offline-ondersteuning, geen installatie-prompt. `display: "browser"`
 * zorgt ervoor dat een eventuele snelkoppeling gewoon in de normale browser
 * (met adresbalk) opent, niet als een appachtig, schermvullend venster.
 *
 * Voor iPhone/iPad ("Zet op beginscherm") is dit bestand niet nodig — dat
 * gebruikt het losse `app/apple-icon.png`-bestand (Next.js voegt daarvoor
 * automatisch een <link rel="apple-touch-icon"> toe). Dit manifest is dus
 * specifiek de aanvulling voor Android/Chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Geëmailleerde Huisnummerbordjes",
    short_name: "Huisnummerbordjes",
    start_url: "/",
    display: "browser",
    icons: [
      {
        src: "/images/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
