import { NextResponse } from "next/server";

/**
 * Zoekt bij een postcode (zonder huisnummer) de straatnaam en woonplaats op,
 * zodat de klant in stap "Controle" bij het intypen van de postcode straat +
 * plaats al ingevuld ziet en alleen nog het huisnummer hoeft te typen.
 * Toegevoegd 9-9-2026 op verzoek van Christiaan. Zie
 * components/configurator/ContactDetailsForm.tsx voor de aanroepende kant.
 *
 * Gebruikt de externe postcode-API van postcodeapi.nu (of een compatibele
 * dienst) via POSTCODE_API_URL/POSTCODE_API_KEY (zie .env.example) — precies
 * hetzelfde patroon als de Mollie/Resend/prijstool-koppelingen: de sleutel
 * staat alleen server-side (nooit in de browser), en draait via een eigen
 * route zodat de sleutel niet in de client-JavaScript terechtkomt.
 *
 * Ontbreken deze environment variables, of lukt het opzoeken om welke reden
 * dan ook niet (dienst onbereikbaar, onbekende postcode, onverwachte
 * gegevens), dan geeft dit endpoint gewoon `{ found: false }` terug — NOOIT
 * een foutmelding aan de klant. De straat/plaats-velden blijven dan leeg en
 * de klant typt ze zelf in, exact zoals vóór deze wijziging. Een storing in
 * deze losse, optionele opzoekfunctie mag nooit het invullen van de
 * contactgegevens of het plaatsen van een bestelling blokkeren.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPostcode = searchParams.get("postcode") ?? "";
  const postcode = rawPostcode.replace(/\s+/g, "").toUpperCase();

  // Nederlandse postcode: 4 cijfers (niet beginnend met 0) + 2 letters. Pas
  // bij een volledig geldige postcode heeft opzoeken zin — bij een postcode
  // die nog niet compleet is (de klant is nog aan het typen) geven we
  // gewoon "niet gevonden" terug, geen foutmelding.
  if (!/^[1-9][0-9]{3}[A-Z]{2}$/.test(postcode)) {
    return NextResponse.json({ found: false });
  }

  const baseUrl = process.env.POSTCODE_API_URL;
  const apiKey = process.env.POSTCODE_API_KEY;
  if (!baseUrl || !apiKey) {
    // Niet ingesteld: geen storing, gewoon geen automatisch invullen (zie
    // toelichting hierboven).
    return NextResponse.json({ found: false });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let res: Response;
    try {
      res = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/v2/addresses/?postcode=${postcode}`,
        {
          headers: { "X-Api-Key": apiKey },
          cache: "no-store",
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      // 404 = onbekende postcode (komt gewoon voor, geen storing); andere
      // statussen (401/429/5xx) loggen we wel, zodat een verkeerde sleutel
      // of een overschreden limiet zichtbaar wordt in de Vercel-logs.
      if (res.status !== 404) {
        console.error(
          `Postcode-opzoeken gaf status ${res.status} terug voor ${postcode}.`
        );
      }
      return NextResponse.json({ found: false });
    }

    const data: unknown = await res.json();
    // Response-vorm van postcodeapi.nu v2 (/v2/addresses/?postcode=...):
    // { _embedded: { addresses: [ { street, city: { label }, ... }, ... ] } }
    // — bij een postcode zonder huisnummer kan dit meerdere adressen
    // bevatten (één per huisnummer in die postcode); straat en plaats zijn
    // in de praktijk voor alle huisnummers binnen dezelfde 6-cijferige/
    // letterige postcode gelijk, dus het eerste adres in de lijst volstaat.
    const addresses = (data as { _embedded?: { addresses?: unknown[] } })
      ?._embedded?.addresses;
    const address = Array.isArray(addresses) ? addresses[0] : undefined;
    const street =
      typeof (address as { street?: unknown })?.street === "string"
        ? (address as { street: string }).street
        : null;
    const city =
      typeof (address as { city?: { label?: unknown } })?.city?.label ===
      "string"
        ? (address as { city: { label: string } }).city.label
        : null;

    if (!street || !city) {
      console.error(
        `Postcode-opzoeken voor ${postcode} gaf een onverwachte/lege response terug.`
      );
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, street, city });
  } catch (err) {
    console.error(
      `Postcode-opzoeken voor ${postcode} is onverwacht mislukt:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ found: false });
  }
}
