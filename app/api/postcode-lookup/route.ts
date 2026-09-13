import { NextResponse } from "next/server";

/**
 * Zoekt bij een postcode de straatnaam en woonplaats op, zodat de klant in
 * stap "Controle" bij het intypen van de postcode straat + plaats al
 * ingevuld ziet — het huisnummer is daar los van, dat typt de klant er zelf
 * nog bij (zie components/configurator/ContactDetailsForm.tsx). Toegevoegd
 * 9-9-2026 op verzoek van Christiaan.
 *
 * Geschiedenis van de gebruikte dienst (belangrijk voor een volgende
 * sessie, mocht dit ooit weer gewisseld moeten worden):
 * 1) Eerst gebouwd op postcodeapi.nu (postcode-alleen opzoeken) — bleek
 *    dezelfde dag al niet meer bruikbaar: v3 vereist een betaald abonnement
 *    voor productiegebruik én accepteert alleen nog postcode + huisnummer
 *    samen, en Christiaan kreeg bij het bezoeken van de site een
 *    waarschuwing over een onveilige verbinding.
 * 2) Overgestapt op openpostcode.nl — gratis, geen account/sleutel nodig,
 *    maar (net als vrijwel alle actuele postcode-diensten) alleen bruikbaar
 *    met postcode + huisnummer SAMEN, niet postcode alleen. Daardoor moest
 *    een klant destijds eerst het huisnummer intypen voordat er iets
 *    opgezocht werd — een tester meldde dit op 13-9-2026 als een storend
 *    knelpunt (huisnummer hoort er pas ná straat/plaats bij te komen, niet
 *    andersom).
 * 3) 13-9-2026: overgestapt op de PDOK Locatieserver
 *    (`api.pdok.nl/bzk/locatieserver`) — de officiële, gratis en
 *    sleutelloze adrezendienst van het Kadaster/de Nederlandse overheid
 *    (onderdeel van de BAG, de landelijke Basisregistratie Adressen en
 *    Gebouwen). Deze dienst kan, anders dan de vorige twee, WEL gewoon op
 *    postcode alleen doorzoekt worden (een Nederlandse postcode (6 tekens)
 *    komt vrijwel altijd overeen met precies 1 straat/woonplaats, ongeacht
 *    het huisnummer) — daardoor kan de opzoekactie nu al starten zodra
 *    alleen de postcode compleet is. Geen dagelijkse limiet/sleutel nodig;
 *    dit is bovendien de brondienst waar praktisch alle Nederlandse
 *    postcode-diensten zelf ook weer op steunen.
 *
 * Bij elke storing (dienst onbereikbaar, onbekende postcode, onverwachte
 * gegevens) geeft dit endpoint gewoon `{ found: false }` terug — NOOIT een
 * foutmelding aan de klant. De straat/plaats-velden blijven dan leeg en de
 * klant typt ze zelf in. Een storing in deze losse, optionele
 * opzoekfunctie mag nooit het invullen van de contactgegevens of het
 * plaatsen van een bestelling blokkeren.
 */
const PDOK_BASE_URL = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

// Veldnamen waar straat/plaats onder kunnen zitten in de respons — eerste
// match wint. "straatnaam"/"woonplaatsnaam" zijn de officiële PDOK-
// veldnamen; de eerdere (openpostcode.nl-)namen staan erbij als onschuldige
// extra terugval, voor het geval de brondienst ooit weer wisselt.
const STREET_KEYS = ["straatnaam", "straat", "street"];
const CITY_KEYS = ["woonplaatsnaam", "woonplaats", "plaats", "city"];

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

  // Nederlandse postcode: 4 cijfers (niet beginnend met 0) + 2 letters, met
  // of zonder spatie/hoofdletters ingetypt — hier genormaliseerd naar de
  // spatieloze hoofdletter-vorm die PDOK verwacht.
  const postcode = rawPostcode.replace(/\s+/g, "").toUpperCase();

  // Pas bij een volledig geldige postcode heeft opzoeken zin — zolang de
  // klant nog aan het typen is, geven we gewoon "niet gevonden" terug, geen
  // foutmelding. Het huisnummer is hier bewust GEEN vereiste (meer): een
  // postcode6 legt straat + plaats al vrijwel altijd ondubbelzinnig vast.
  if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode)) {
    return NextResponse.json({ found: false });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const params = new URLSearchParams({
      fq: `postcode:${postcode}`,
      rows: "1",
    });
    // Twee "fq"-parameters nodig (type + postcode) — URLSearchParams staat
    // geen dubbele key toe via het object hierboven, dus de tweede wordt
    // los toegevoegd.
    params.append("fq", "type:adres");

    let res: Response;
    try {
      res = await fetch(`${PDOK_BASE_URL}?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "huisnummerbordjes-webshop (contact via christiaan@tenhaaken.nl)",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await res.text();

    if (!res.ok) {
      console.error(
        `Postcode-opzoeken (PDOK) gaf status ${res.status} terug voor ${postcode}. Ruwe respons: ${rawBody.slice(0, 500)}`
      );
      return NextResponse.json({ found: false });
    }

    let data: unknown;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error(
        `Postcode-opzoeken (PDOK) voor ${postcode}: respons was geen geldige JSON. Ruwe respons: ${rawBody.slice(0, 500)}`
      );
      return NextResponse.json({ found: false });
    }

    // PDOK-responsvorm: { response: { numFound, docs: [ {...}, ... ] } }.
    const docs = (data as { response?: { docs?: unknown[] } })?.response?.docs;
    const firstDoc = Array.isArray(docs) ? docs[0] : undefined;

    if (!firstDoc) {
      // Onbekende postcode — komt gewoon voor, geen storing, dus niet loggen.
      return NextResponse.json({ found: false });
    }

    const street = findStringField(firstDoc, STREET_KEYS);
    const city = findStringField(firstDoc, CITY_KEYS);

    if (!street || !city) {
      console.error(
        `Postcode-opzoeken (PDOK) voor ${postcode} gaf een onverwachte/lege response terug. Ruwe respons: ${rawBody.slice(0, 500)}`
      );
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, street, city });
  } catch (err) {
    console.error(
      `Postcode-opzoeken (PDOK) voor ${postcode} is onverwacht mislukt:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ found: false });
  }
}
