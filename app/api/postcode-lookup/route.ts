import { NextResponse } from "next/server";

/**
 * Zoekt bij een postcode + huisnummer de straatnaam en woonplaats op, zodat
 * de klant in stap "Controle" bij het intypen van postcode + huisnummer
 * straat + plaats al ingevuld ziet. Toegevoegd 9-9-2026 op verzoek van
 * Christiaan. Zie components/configurator/ContactDetailsForm.tsx voor de
 * aanroepende kant.
 *
 * Aangepast, later diezelfde dag: eerst gebouwd op postcodeapi.nu met een
 * opzoeking op postcode ALLEEN. Twee redenen om over te stappen op
 * openpostcode.nl:
 * 1) postcodeapi.nu draait inmiddels op v3, en die vereist een betaald
 *    abonnement voor productiegebruik én accepteert alléén nog postcode +
 *    huisnummer samen — postcode-alleen opzoeken kan daar niet meer.
 * 2) Christiaan kreeg bij het bezoeken van postcodeapi.nu een waarschuwing
 *    over een onveilige verbinding.
 * openpostcode.nl is gratis, vereist geen account/API-sleutel (dus ook
 * niets om zelf te hoeven aanmaken of vertrouwen), en werkt — net als
 * vrijwel alle actuele postcode-diensten — ook op basis van postcode +
 * huisnummer samen, niet postcode alleen. Vandaar dat de opzoekactie aan
 * de kant van ContactDetailsForm.tsx pas start zodra beide zijn ingevuld.
 *
 * Nogmaals aangepast, zelfde dag: bij Christiaan's eerste test kwam er
 * niets terug (wél "bezig met opzoeken…", daarna gewoon niets ingevuld).
 * Omdat ik de échte, live JSON-respons van openpostcode.nl niet zelf kon
 * narekenen (alleen de documentatie/voorbeelden van de aanbieder zelf, niet
 * een eigen test-aanroep), is deze versie extra defensief gemaakt:
 * - stuurt nu een Accept-header en een eigen User-Agent mee (sommige
 *   diensten weigeren stille verzoeken zonder herkenbare User-Agent);
 * - leest de respons eerst als platte tekst en probeert die pas daarna als
 *   JSON te parsen, met de ruwe tekst in de Vercel/terminal-logs bij een
 *   fout — zo is precies te zien wát er misging (verkeerde vorm, HTML-
 *   foutpagina, rate-limit-melding, etc.) in plaats van dat het stil faalt;
 * - zoekt straat/plaats niet alleen op het verwachte, platte niveau
 *   (data.straat / data.woonplaats), maar ook een laagje dieper (bv.
 *   data.address.straat), voor het geval de respons anders genest blijkt
 *   te zijn dan de documentatie van de aanbieder aangaf.
 * Zie ook: als dit na deze wijziging nog steeds niets vindt, staat de
 * exacte reden (met de ruwe respons) in de serverlogs — bij "npm run dev"
 * in het terminalvenster, bij Vercel onder het project -> Logs.
 *
 * Bij elke storing (dienst onbereikbaar, onbekende postcode/huisnummer,
 * onverwachte gegevens) geeft dit endpoint gewoon `{ found: false }`
 * terug — NOOIT een foutmelding aan de klant. De straat/plaats-velden
 * blijven dan leeg en de klant typt ze zelf in, exact zoals vóór deze
 * wijziging. Een storing in deze losse, optionele opzoekfunctie mag nooit
 * het invullen van de contactgegevens of het plaatsen van een bestelling
 * blokkeren.
 *
 * Geen environment variables nodig: openpostcode.nl is gratis en vereist
 * geen account of API-sleutel (zie openpostcode.nl/gebruiksvoorwaarden —
 * tot 5000 opzoekingen per dag, ruim voldoende voor deze webshop). Wil je
 * ooit een andere dienst gebruiken, pas dan OPENPOSTCODE_BASE_URL hieronder
 * aan (en eventueel STREET_KEYS/CITY_KEYS verderop in dit bestand).
 */
const OPENPOSTCODE_BASE_URL = "https://openpostcode.nl/api/v2/address";

// Veldnamen waar straat/plaats onder kunnen zitten in de respons — eerste
// match wint. "straat"/"woonplaats" zijn wat de documentatie van
// openpostcode.nl aangeeft; de Engelse varianten staan erbij voor het
// (onbevestigde) geval dat de live respons daarvan afwijkt.
const STREET_KEYS = ["straat", "street"];
const CITY_KEYS = ["woonplaats", "plaats", "city"];

function findStringField(
  source: unknown,
  keys: string[],
  depth = 2
): string | null {
  if (!source || typeof source !== "object" || depth < 0) return null;
  const obj = source as Record<string, unknown>;
  for (const key of keys) {
    if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
  }
  if (depth === 0) return null;
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = findStringField(value, keys, depth - 1);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPostcode = searchParams.get("postcode") ?? "";
  const rawHouseNumber = searchParams.get("huisnummer") ?? "";

  // Nederlandse postcode: 4 cijfers (niet beginnend met 0) + 2 letters.
  const postcode = rawPostcode.replace(/\s+/g, "").toUpperCase();
  // Alleen het voorste, numerieke deel van het huisnummer gebruiken voor de
  // opzoekactie (bv. "12A" -> "12", "12-1" -> "12") — een toevoeging
  // verandert de straat/plaats niet, en de klant houdt zijn volledig
  // ingetypte huisnummer (mét toevoeging) gewoon aan; dat gebeurt in
  // ContactDetailsForm.tsx, niet hier.
  const houseNumberMatch = rawHouseNumber.match(/^\d+/);

  // Pas bij een volledig geldige postcode + huisnummer heeft opzoeken zin —
  // zolang de klant nog aan het typen is, geven we gewoon "niet gevonden"
  // terug, geen foutmelding.
  if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode) || !houseNumberMatch) {
    return NextResponse.json({ found: false });
  }
  const houseNumber = houseNumberMatch[0];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let res: Response;
    try {
      res = await fetch(
        `${OPENPOSTCODE_BASE_URL}?postcode=${postcode}&huisnummer=${houseNumber}`,
        {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "huisnummerbordjes-webshop (contact via christiaan@tenhaaken.nl)",
          },
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await res.text();

    if (!res.ok) {
      // 404 = onbekende postcode/huisnummer-combinatie (komt gewoon voor,
      // geen storing); andere statussen (429/5xx) loggen we wel, mét de
      // ruwe respons, zodat een structureel probleem zichtbaar wordt in de
      // Vercel/terminal-logs.
      if (res.status !== 404) {
        console.error(
          `Postcode-opzoeken gaf status ${res.status} terug voor ${postcode} ${houseNumber}. Ruwe respons: ${rawBody.slice(0, 500)}`
        );
      }
      return NextResponse.json({ found: false });
    }

    let data: unknown;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error(
        `Postcode-opzoeken voor ${postcode} ${houseNumber}: respons was geen geldige JSON. Ruwe respons: ${rawBody.slice(0, 500)}`
      );
      return NextResponse.json({ found: false });
    }

    if (typeof (data as { error?: unknown })?.error === "string") {
      return NextResponse.json({ found: false });
    }

    const street = findStringField(data, STREET_KEYS);
    const city = findStringField(data, CITY_KEYS);

    if (!street || !city) {
      console.error(
        `Postcode-opzoeken voor ${postcode} ${houseNumber} gaf een onverwachte/lege response terug. Ruwe respons: ${rawBody.slice(0, 500)}`
      );
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, street, city });
  } catch (err) {
    console.error(
      `Postcode-opzoeken voor ${postcode} ${houseNumber} is onverwacht mislukt:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ found: false });
  }
}
