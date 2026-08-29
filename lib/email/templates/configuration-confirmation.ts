import { formatPriceCents } from "@/lib/configuration/pricing";

interface ConfigurationEmailData {
  // Het eigen bestelnummer van de webshop (bv. "#630002"), toegevoegd
  // 29-8-2026 op verzoek van Christiaan — al kant-en-klaar geformatteerd
  // doorgegeven, zie lib/email/sendOrderEmails.ts.
  orderNumber?: string;
  shapeName: string;
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
}

/**
 * Bouwt de HTML-inhoud van de bevestigingsmail. E-mailclients ondersteunen
 * geen Tailwind/externe CSS, dus alle styling staat bewust inline.
 */
export function renderConfigurationEmail(data: ConfigurationEmailData): string {
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
  // door, inclusief de overgang tussen zomer- en wintertijd.
  const date = new Date().toLocaleString("nl-NL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });

  return `
  <!DOCTYPE html>
  <html lang="nl">
    <body style="margin:0;padding:0;background-color:#f4f1ea;font-family:Georgia, 'Times New Roman', serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ea;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e5e0d5;">
              <tr>
                <td style="background-color:#1B2A41;padding:24px 32px;">
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">Nieuwe configuratie huisnummerbordje</span>
                  <div style="color:#a9b0bd;font-size:13px;margin-top:4px;">Ontvangen op ${date}</div>
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
                    Contactgegevens
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Naam", data.contact.name)}
                    ${row("Adres", data.contact.address)}
                    ${row("Postcode", data.contact.postalCode)}
                    ${row("Woonplaats", data.contact.city)}
                    ${row("E-mail", data.contact.email)}
                    ${data.contact.phone ? row("Telefoon", data.contact.phone) : ""}
                    ${row("Aantal", data.contact.quantity)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Configuratie
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${data.orderNumber ? row("Bestelnummer", data.orderNumber) : ""}
                    ${row("Vorm", data.shapeName)}
                    ${row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${row("Kleur", data.colorName)}
                    ${row("Maat", data.sizeName)}
                    ${row("Huisnummer", data.customText)}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${data.orderLabel ? row("Volgorde", data.orderLabel) : ""}
                    ${row("Lettertype huisnummer", data.numberFontName)}
                    ${data.line1FontName ? row("Lettertype tekstregel 1", data.line1FontName) : ""}
                    ${data.line2FontName ? row("Lettertype tekstregel 2", data.line2FontName) : ""}
                    ${row(
                      "Kader",
                      data.hasFrame
                        ? `Ja – ${
                            data.priceFrameSurchargeCents != null
                              ? formatPriceCents(data.priceFrameSurchargeCents)
                              : "prijs op aanvraag"
                          }`
                        : "Nee"
                    )}
                    ${
                      data.priceColorSurchargeCents
                        ? row("Meerprijs kleur", formatPriceCents(data.priceColorSurchargeCents))
                        : ""
                    }
                    ${
                      data.priceExtraCharsCents
                        ? row(
                            `Meerprijs extra tekens (${data.priceExtraCharsCount}×)`,
                            formatPriceCents(data.priceExtraCharsCents)
                          )
                        : ""
                    }
                    ${row(
                      "Totaalprijs",
                      data.priceTotalCents != null
                        ? formatPriceCents(data.priceTotalCents)
                        : "Prijs op aanvraag"
                    )}
                    ${
                      data.paymentMethodName && data.paidAt
                        ? row("Betaalmethode", data.paymentMethodName) +
                          row("Betaald op", data.paidAt)
                        : ""
                    }
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 28px;">
                  <span style="color:#9a9384;font-size:12px;">
                    Deze e-mail is automatisch gegenereerd vanuit de configurator.
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
