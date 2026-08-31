import type { MetadataRoute } from "next";

/**
 * Automatische sitemap.xml (31-8-2026, op verzoek van Christiaan) — helpt
 * zoekmachines (Google e.d.) de belangrijkste pagina's van de webshop
 * vinden en makkelijker indexeren. Next.js herkent dit bestand automatisch
 * (bestandsnaam `app/sitemap.ts`) en serveert 'm zelf op `/sitemap.xml` —
 * daar hoeft verder niets voor aangepast te worden.
 *
 * Gebruikt dezelfde `SITE_URL`-environment variable als de rest van de site
 * (zie lib/mollie/client.ts) — dus zodra Christiaan ooit een eigen
 * domeinnaam koppelt en `SITE_URL` in Vercel bijwerkt, volgt de sitemap dat
 * automatisch mee, zonder dat dit bestand aangepast hoeft te worden. Bewust
 * NIET de `getSiteUrl()`-functie uit lib/mollie/client.ts hergebruikt (die
 * gooit een harde foutmelding als de variabele ontbreekt, wat geschikt is
 * voor een betaling maar niet voor een sitemap) — hier valt de sitemap in
 * plaats daarvan terug op het huidige, bekende Vercel-adres, zodat een
 * eventuele ontbrekende variabele nooit de hele site kan laten breken.
 *
 * Bewust WEL opgenomen: de homepage, het startpunt van de configurator
 * (de eerste echte stap, /configurator/vorm — niet /configurator zelf, dat
 * meteen doorstuurt), de contactpagina's en de 4 vaste informatiepagina's.
 *
 * Bewust NIET opgenomen:
 * - De overige configuratorstappen (kleur/maat/afwerking/tekst/opties/
 *   controle): dit zijn geen zelfstandige pagina's om op te landen (ze
 *   bouwen voort op eerdere keuzes) en horen dus niet in een sitemap thuis.
 * - /bestelling/bedankt: een pagina die alleen met een besteld-specifiek
 *   nummer in de link werkt (bv. ?order=123) — nooit geschikt om te
 *   indexeren.
 */
const SITE_URL = (
  process.env.SITE_URL ?? "https://huisnummerbordje.vercel.app"
).replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/configurator/vorm`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact/vraag`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/leveringsvoorwaarden`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/retourneren-reclameren`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacyverklaring`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/cookiebeleid`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
