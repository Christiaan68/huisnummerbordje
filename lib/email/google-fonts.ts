// Haalt een lettertype-bestand (TTF) van Google Fonts op, voor gebruik in
// de server-side gegenereerde voorbeeldafbeelding (zie plate-preview-image.tsx).
//
// Waarom dit nodig is: de afbeeldingsgenerator (next/og, gebaseerd op
// Satori) rendert lettertypes helemaal zelf en heeft daarvoor de losse
// fontdata nodig — hij kan niet, zoals een browser, terugvallen op een
// lettertype dat toevallig op de server geïnstalleerd staat. Satori
// ondersteunt bovendien alleen .ttf/.otf/.woff, geen .woff2 (de standaard
// die Google Fonts tegenwoordig aan browsers teruggeeft). Door de Google
// Fonts CSS met een "oude" browser-useragent op te vragen, geeft Google
// zelf een .ttf-link terug in plaats van .woff2 — een bekende, veelgebruikte
// omweg hiervoor.
//
// Voor "Klassiek" en "Modern" gebruiken we bewust NIET de daadwerkelijke
// Georgia/Helvetica-lettertypes: dat zijn systeemlettertypes van
// Microsoft/Apple die niet los als bestand meegeleverd mogen worden. In
// plaats daarvan gebruiken we Gelasio en Arimo — dit zijn door Google zelf
// gemaakte, vrij te gebruiken lettertypes die bewust "metric compatible"
// zijn met Georgia respectievelijk Arial: exact dezelfde letterbreedtes en
// vrijwel identiek ontwerp, dus zichtbaar (en voor de tekstgrootte-
// berekening ook functioneel) hetzelfde resultaat, zonder licentieprobleem.
// Zie config/product-options.ts / plate-preview-image.tsx voor de koppeling
// per lettertype-optie.

const FONT_CACHE = new Map<string, ArrayBuffer>();

// Google Fonts bepaalt het teruggegeven bestandsformaat (woff2/woff/ttf)
// aan de hand van de User-Agent van het verzoek — een "browser-achtige"
// User-Agent levert (moderne) .woff2 op, een niet-browser-achtige (zoals
// curl, zonder verdere details) levert .ttf op. Dat laatste is precies wat
// hier nodig is.
const NON_BROWSER_USER_AGENT = "curl/8.4.0";

async function fetchGoogleFontCss(
  family: string,
  weight: number
): Promise<string> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&display=swap`;

  const res = await fetch(url, {
    headers: { "User-Agent": NON_BROWSER_USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(
      `Google Fonts CSS ophalen mislukt voor "${family}" (${weight}): HTTP ${res.status}`
    );
  }

  return res.text();
}

function extractFontUrl(css: string): string {
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) {
    throw new Error("Geen lettertype-URL gevonden in de Google Fonts CSS-response.");
  }
  return match[1];
}

/**
 * Haalt de ruwe .ttf-data op voor een Google Font (naam + gewicht), met
 * een simpele in-memory cache zodat dit binnen dezelfde (warme)
 * serverless-instantie niet telkens opnieuw hoeft.
 */
export async function loadGoogleFont(
  family: string,
  weight: number
): Promise<ArrayBuffer> {
  const cacheKey = `${family}:${weight}`;
  const cached = FONT_CACHE.get(cacheKey);
  if (cached) return cached;

  const css = await fetchGoogleFontCss(family, weight);
  const fontUrl = extractFontUrl(css);

  const fontRes = await fetch(fontUrl);
  if (!fontRes.ok) {
    throw new Error(
      `Lettertype-bestand ophalen mislukt voor "${family}" (${weight}): HTTP ${fontRes.status}`
    );
  }

  const buffer = await fontRes.arrayBuffer();
  FONT_CACHE.set(cacheKey, buffer);
  return buffer;
}
