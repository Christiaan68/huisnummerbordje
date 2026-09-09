import { formatPriceCents } from "@/lib/configuration/pricing";

interface ConfigurationEmailData {
  // Het eigen bestelnummer van de webshop (bv. "#630002"), toegevoegd
  // 29-8-2026 op verzoek van Christiaan — al kant-en-klaar geformatteerd
  // doorgegeven, zie lib/email/sendOrderEmails.ts.
  orderNumber?: string;
  shapeName: string;
  // Id van de vorm (bv. "nummer", "ovaal" — zie config/product-options.ts),
  // toegevoegd 9-9-2026 zodat de vaste vormnaam (zie shapeNames hieronder
  // bij TRANSLATIONS) voor het Duits vertaald kan worden op basis van een
  // stabiel id, in plaats van te moeten matchen op de Nederlandse tekst.
  // Onbekend/ontbreekt → shapeName wordt ongewijzigd getoond (zie render-
  // functie).
  shapeId?: string;
  finish: "vlak" | "gewelfd";
  colorName: string;
  sizeName: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  numberSizeMm: number;
  line1SizeMm?: number;
  line2SizeMm?: number;
  // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype (zie
  // types/configuration.ts) — line1FontName/line2FontName zijn alleen
  // gezet als die tekstregel bestaat.
  numberFontName: string;
  line1FontName?: string;
  line2FontName?: string;
  hasFrame?: boolean;
  contact: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    email: string;
    phone?: string;
    quantity: string;
  };
  orderLabel?: string;
  // Content-id van de bijgevoegde voorbeeldafbeelding van het bordje (zie
  // app/api/send-email/route.ts / lib/email/plate-preview-image.tsx) — op
  // verzoek van Christiaan (29-8-2026) toegevoegd aan ook déze interne
  // meldingsmail, niet alleen aan de klantmail. Onbekend/leeg (bv. omdat
  // het genereren onverhoopt mislukt is) → geen afbeelding tonen, de rest
  // van de mail blijft gewoon werken.
  previewImageCid?: string;
  // Prijs — zie lib/configuration/pricing.ts. priceTotalCents is null
  // wanneer er (nog) geen prijs bekend is voor deze maat/afwerking.
  priceTotalCents?: number | null;
  priceColorSurchargeCents?: number;
  priceExtraCharsCents?: number;
  priceExtraCharsCount?: number;
  priceFrameSurchargeCents?: number;
  // Betaalgegevens via Mollie (toegevoegd 29-8-2026, na de eerste live
  // test — Christiaan wilde in de mail kunnen zien dát en waarmee er
  // betaald is). Al kant-en-klaar geformatteerd doorgegeven, zie
  // lib/mollie/client.ts (getPaymentMethodLabel) en lib/formatDate.ts.
  paymentMethodName?: string;
  paidAt?: string;
  // Taal van deze (interne) meldingsmail, per vorm ingesteld in de prijstool
  // (zie lib/email/shapeLanguage.ts en lib/email/sendOrderEmails.ts) —
  // standaard "nl" wanneer er voor de vorm nog niets is ingesteld. Vertaalt
  // de vaste teksten/labels hieronder, én (via shapeNames, zie TRANSLATIONS)
  // de naam van de vorm zelf — dat is namelijk ook een vaste tekst uit een
  // bekende, beperkte lijst (config/product-options.ts), geen vrije
  // klantinvoer. De overige configuratie- en bestelgegevens (kleur, maat,
  // ingevoerde tekst, contactgegevens, enz.) komen ongewijzigd binnen en
  // worden niet vertaald.
  language?: "nl" | "de";
}

const TRANSLATIONS = {
  nl: {
    htmlLang: "nl",
    heading: "Nieuwe configuratie huisnummerbordje",
    receivedOn: "Ontvangen op",
    contactHeading: "Contactgegevens",
    labelName: "Naam",
    labelAddress: "Adres",
    labelPostalCode: "Postcode",
    labelCity: "Woonplaats",
    labelEmail: "E-mail",
    labelPhone: "Telefoon",
    labelQuantity: "Aantal",
    configHeading: "Configuratie",
    labelOrderNumber: "Bestelnummer",
    labelShape: "Vorm",
    labelFinish: "Afwerking",
    finishFlat: "Vlak",
    finishCurved: "Gewelfd",
    labelColor: "Kleur",
    labelSize: "Maat",
    labelHouseNumber: "Huisnummer",
    labelExtraLine1: "Tekstregel 1",
    labelExtraLine2: "Tekstregel 2",
    labelOrderLabel: "Volgorde",
    labelNumberFont: "Lettertype huisnummer",
    labelLine1Font: "Lettertype tekstregel 1",
    labelLine2Font: "Lettertype tekstregel 2",
    labelFrame: "Kader",
    frameYes: "Ja",
    frameNo: "Nee",
    priceOnRequest: "prijs op aanvraag",
    labelColorSurcharge: "Meerprijs kleur",
    labelExtraCharsSurcharge: "Meerprijs extra tekens",
    labelTotalPrice: "Totaalprijs",
    totalPriceOnRequest: "Prijs op aanvraag",
    labelPaymentMethod: "Betaalmethode",
    labelPaidAt: "Betaald op",
    footer: "Deze e-mail is automatisch gegenereerd vanuit de configurator.",
    dateLocale: "nl-NL",
    // Nederlandse vormnamen — identiek aan config/product-options.ts, hier
    // alleen genoteerd voor symmetrie met de Duitse vertaling hieronder.
    // Wijzigt zo'n naam ooit in product-options.ts, dan hoeft dit hier niet
    // per se mee te veranderen: bij een onbekend/ontbrekend shapeId valt de
    // render-functie sowieso terug op de meegegeven shapeName zelf.
    shapeNames: {
      nummer: "Huisnummer vierhoek",
      "nummer-1regel": "Huisnummer vierhoek + 1 regel",
      "nummer-2regels": "Huisnummer vierhoek + 2 regels",
      ovaal: "Huisnummer ovaal",
    } as Record<string, string>,
  },
  de: {
    htmlLang: "de",
    heading: "Neue Konfiguration Hausnummernschild",
    receivedOn: "Empfangen am",
    contactHeading: "Kontaktdaten",
    labelName: "Name",
    labelAddress: "Adresse",
    labelPostalCode: "Postleitzahl",
    labelCity: "Wohnort",
    labelEmail: "E-Mail",
    labelPhone: "Telefon",
    labelQuantity: "Anzahl",
    configHeading: "Konfiguration",
    labelOrderNumber: "Bestellnummer",
    labelShape: "Form",
    labelFinish: "Ausführung",
    finishFlat: "Flach",
    finishCurved: "Gewölbt",
    labelColor: "Farbe",
    labelSize: "Größe",
    labelHouseNumber: "Hausnummer",
    labelExtraLine1: "Textzeile 1",
    labelExtraLine2: "Textzeile 2",
    labelOrderLabel: "Reihenfolge",
    labelNumberFont: "Schriftart Hausnummer",
    labelLine1Font: "Schriftart Textzeile 1",
    labelLine2Font: "Schriftart Textzeile 2",
    labelFrame: "Rahmen",
    frameYes: "Ja",
    frameNo: "Nein",
    priceOnRequest: "Preis auf Anfrage",
    labelColorSurcharge: "Aufpreis Farbe",
    labelExtraCharsSurcharge: "Aufpreis Extrazeichen",
    labelTotalPrice: "Gesamtpreis",
    totalPriceOnRequest: "Preis auf Anfrage",
    labelPaymentMethod: "Zahlungsmethode",
    labelPaidAt: "Bezahlt am",
    footer: "Diese E-Mail wurde automatisch vom Konfigurator generiert.",
    dateLocale: "de-DE",
    // Vertaling van de vaste vormnamen (zie shapeId hierboven bij
    // ConfigurationEmailData en config/product-options.ts voor de bron-
    // waarden/id's) — toegevoegd 9-9-2026 op verzoek van Christiaan, nadat
    // bleek dat "Huisnummer vierhoek"/"vierhoek"/"1 regel"/"2 regels" nog
    // onvertaald in de Duitse mail stonden. Komt er ooit een nieuwe vorm
    // bij in product-options.ts, dan moet die hier ook toegevoegd worden —
    // zolang dat niet gebeurt, valt de render-functie terug op de
    // (Nederlandse) shapeName zelf, dus niets breekt.
    shapeNames: {
      nummer: "Hausnummer viereckig",
      "nummer-1regel": "Hausnummer viereckig + 1 Zeile",
      "nummer-2regels": "Hausnummer viereckig + 2 Zeilen",
      ovaal: "Hausnummer oval",
    } as Record<string, string>,
  },
} as const;

/**
 * Vertaalt een vormnaam (bv. "Huisnummer vierhoek + 1 regel") naar de
 * opgegeven taal, via het shapeId (zie shapeNames hierboven). Onbekend
 * shapeId, of geen vertaling voor dat id → geeft fallbackName ongewijzigd
 * terug, zodat een ontbrekende/verouderde vertaling nooit een lege of
 * kapotte tekst oplevert.
 *
 * Los geëxporteerd (naast renderConfigurationEmail) omdat ook het onderwerp
 * van de mail (zie lib/email/sendOrderEmails.ts) dezelfde vertaalde
 * vormnaam moet tonen als de mail-inhoud zelf — anders staat de body in het
 * Duits maar het onderwerp nog in het Nederlands.
 */
export function translateShapeName(
  shapeId: string | undefined,
  language: "nl" | "de" | undefined,
  fallbackName: string
): string {
  const t = TRANSLATIONS[language ?? "nl"];
  return (shapeId && t.shapeNames[shapeId]) || fallbackName;
}

/**
 * Bouwt de HTML-inhoud van de bevestigingsmail. E-mailclients ondersteunen
 * geen Tailwind/externe CSS, dus alle styling staat bewust inline.
 */
export function renderConfigurationEmail(data: ConfigurationEmailData): string {
  const t = TRANSLATIONS[data.language ?? "nl"];

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#6b6558;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">${value}</td>
    </tr>
  `;

  // De server waar de webshop op draait rekent in UTC (internationale
  // standaardtijd), niet in Nederlandse tijd — zonder expliciete
  // "timeZone" hierbeneden stond hier daardoor een tijd die in de zomer
  // 2 uur (zomertijd) en in de winter 1 uur (wintertijd) achterliep op de
  // daadwerkelijke Nederlandse tijd (gemeld door Christiaan, 29-8-2026).
  // "Europe/Amsterdam" rekent dat verschil automatisch mee, het hele jaar
  // door, inclusief de overgang tussen zomer- en wintertijd. De locale
  // (t.dateLocale) volgt sindsdien de taal van deze mail — nl-NL of de-DE —
  // zodat bijvoorbeeld de maandnaam ook in de juiste taal staat.
  const date = new Date().toLocaleString(t.dateLocale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });

  return `
  <!DOCTYPE html>
  <html lang="${t.htmlLang}">
    <body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Georgia, 'Times New Roman', serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e5e0d5;">
              <tr>
                <td style="background-color:#1B2A41;padding:24px 32px;">
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">${t.heading}</span>
                  <div style="color:#a9b0bd;font-size:13px;margin-top:4px;">${t.receivedOn} ${date}</div>
                </td>
              </tr>
              ${
                data.previewImageCid
                  ? `
              <tr>
                <td style="padding:20px 32px 0;" align="center">
                  <img
                    src="cid:${data.previewImageCid}"
                    alt="Voorbeeld van het geconfigureerde huisnummerbordje"
                    width="320"
                    style="display:block;max-width:320px;width:100%;height:auto;border-radius:6px;"
                  />
                </td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    ${t.contactHeading}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row(t.labelName, data.contact.name)}
                    ${row(t.labelAddress, data.contact.address)}
                    ${row(t.labelPostalCode, data.contact.postalCode)}
                    ${row(t.labelCity, data.contact.city)}
                    ${row(t.labelEmail, data.contact.email)}
                    ${data.contact.phone ? row(t.labelPhone, data.contact.phone) : ""}
                    ${row(t.labelQuantity, data.contact.quantity)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    ${t.configHeading}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${data.orderNumber ? row(t.labelOrderNumber, data.orderNumber) : ""}
                    ${row(
                      t.labelShape,
                      translateShapeName(data.shapeId, data.language, data.shapeName)
                    )}
                    ${row(t.labelFinish, data.finish === "vlak" ? t.finishFlat : t.finishCurved)}
                    ${row(t.labelColor, data.colorName)}
                    ${row(t.labelSize, data.sizeName)}
                    ${row(t.labelHouseNumber, data.customText)}
                    ${data.extraLine1 ? row(t.labelExtraLine1, data.extraLine1) : ""}
                    ${data.extraLine2 ? row(t.labelExtraLine2, data.extraLine2) : ""}
                    ${data.orderLabel ? row(t.labelOrderLabel, data.orderLabel) : ""}
                    ${row(t.labelNumberFont, data.numberFontName)}
                    ${data.line1FontName ? row(t.labelLine1Font, data.line1FontName) : ""}
                    ${data.line2FontName ? row(t.labelLine2Font, data.line2FontName) : ""}
                    ${row(
                      t.labelFrame,
                      data.hasFrame
                        ? `${t.frameYes} – ${
                            data.priceFrameSurchargeCents != null
                              ? formatPriceCents(data.priceFrameSurchargeCents)
                              : t.priceOnRequest
                          }`
                        : t.frameNo
                    )}
                    ${
                      data.priceColorSurchargeCents
                        ? row(t.labelColorSurcharge, formatPriceCents(data.priceColorSurchargeCents))
                        : ""
                    }
                    ${
                      data.priceExtraCharsCents
                        ? row(
                            `${t.labelExtraCharsSurcharge} (${data.priceExtraCharsCount}×)`,
                            formatPriceCents(data.priceExtraCharsCents)
                          )
                        : ""
                    }
                    ${row(
                      t.labelTotalPrice,
                      data.priceTotalCents != null
                        ? formatPriceCents(data.priceTotalCents)
                        : t.totalPriceOnRequest
                    )}
                    ${
                      data.paymentMethodName && data.paidAt
                        ? row(t.labelPaymentMethod, data.paymentMethodName) +
                          row(t.labelPaidAt, data.paidAt)
                        : ""
                    }
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 28px;">
                  <span style="color:#9a9384;font-size:12px;">
                    ${t.footer}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
