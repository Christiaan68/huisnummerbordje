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
 * aan (en de manier waarop de straat/plaats uit de respons gehaald worden
 * verderop in dit bestand).
 */
const OPENPOSTCODE_BASE_URL = "https://openpostcode.nl/api/v2/address";

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
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      // 404 = onbekende postcode/huisnummer-combinatie (komt gewoon voor,
      // geen storing); andere statussen (429/5xx) loggen we wel, zodat een
      // structureel probleem zichtbaar wordt in de Vercel-logs.
      if (res.status !== 404) {
        console.error(
          `Postcode-opzoeken gaf status ${res.status} terug voor ${postcode} ${houseNumber}.`
        );
      }
      return NextResponse.json({ found: false });
    }

    const data: unknown = await res.json();
    // Response-vorm van openpostcode.nl (/api/v2/address?postcode=...&huisnummer=...):
    // { straat, woonplaats, gemeente, provincie, buurt, wijk, latitude, longitude }
    // bij een bekend adres, of { error: "...", suggestions: [...] } wanneer
    // de postcode/het huisnummer niet klopt.
    if (typeof (data as { error?: unknown })?.error === "string") {
      return NextResponse.json({ found: false });
    }
    const street =
      typeof (data as { straat?: unknown })?.straat === "string"
        ? (data as { straat: string }).straat
        : null;
    const city =
      typeof (data as { woonplaats?: unknown })?.woonplaats === "string"
        ? (data as { woonplaats: string }).woonplaats
        : null;

    if (!street || !city) {
      console.error(
        `Postcode-opzoeken voor ${postcode} ${houseNumber} gaf een onverwachte/lege response terug.`
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
