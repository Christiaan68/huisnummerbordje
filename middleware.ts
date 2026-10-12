import { NextResponse, type NextRequest } from "next/server";

/**
 * "Uit"-schakelaar voor het nieuwe domein (toegevoegd 12-10-2026, op verzoek
 * van Christiaan): zolang de webshop nog niet op emaillehuisnummerbord.nl
 * online mag, tonen de adressen die in de environment variable
 * OFFLINE_HOSTS staan een nette "Binnenkort beschikbaar"-pagina in plaats
 * van de webshop.
 *
 * Werking:
 * - OFFLINE_HOSTS is een lijst met domeinnamen, gescheiden door komma's,
 *   zonder https:// en zonder slash, bv.
 *   emaillehuisnummerbord.nl,www.emaillehuisnummerbord.nl
 * - Is de variabele leeg of niet ingesteld, dan doet deze middleware niets:
 *   de webshop werkt dan overal zoals normaal. Openen van het nieuwe domein
 *   = OFFLINE_HOSTS verwijderen (of leegmaken) in Vercel en opnieuw
 *   deployen (Redeploy).
 * - Alleen verzoeken op de genoemde domeinnamen worden tegengehouden.
 *   Het gewone Vercel-adres, de Mollie-webhook, de betaalterugkeer en de
 *   bestellingen blijven werken, want die lopen via een ander adres
 *   (SITE_URL).
 *
 * LET OP: zet SITE_URL pas op het nieuwe domein NADAT OFFLINE_HOSTS is
 * leeggemaakt. Mollie stuurt klanten na de betaling terug naar SITE_URL;
 * staat dat adres nog "uit", dan krijgt de klant de wachtpagina te zien.
 */

const OFFLINE_PAGE_HTML = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Binnenkort beschikbaar</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    display: flex; align-items: center; justify-content: center;
    background: #2b3a36; color: #f0ebdf;
    font-family: Georgia, "Times New Roman", serif;
    padding: 24px; box-sizing: border-box;
  }
  main { max-width: 520px; text-align: center; }
  h1 { font-size: 2rem; font-weight: 400; margin: 0 0 16px; }
  p {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 1rem; line-height: 1.6; color: #c9c3b4; margin: 0;
  }
  .rule { width: 48px; height: 2px; background: #b5703f; margin: 0 auto 24px; }
</style>
</head>
<body>
<main>
  <div class="rule"></div>
  <h1>Binnenkort beschikbaar</h1>
  <p>Onze webshop voor emaille huisnummerborden is bijna klaar. Kom binnenkort nog eens terug.</p>
</main>
</body>
</html>`;

function getOfflineHosts(): string[] {
  const raw = process.env.OFFLINE_HOSTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}

export function middleware(request: NextRequest) {
  const offlineHosts = getOfflineHosts();
  if (offlineHosts.length === 0) return NextResponse.next();

  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = hostHeader.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");

  if (!offlineHosts.includes(host)) return NextResponse.next();

  return new NextResponse(OFFLINE_PAGE_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  // Alle paden (ook /api), behalve Next.js' eigen statische bestanden — de
  // wachtpagina hierboven is volledig zelfstandig en heeft die niet nodig.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
