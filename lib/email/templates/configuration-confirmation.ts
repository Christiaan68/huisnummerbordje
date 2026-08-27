import { formatPriceCents } from "@/lib/configuration/pricing";

interface ConfigurationEmailData {
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
  fontName: string;
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
  // Prijs — zie lib/configuration/pricing.ts. priceTotalCents is null
  // wanneer er (nog) geen prijs bekend is voor deze maat/afwerking.
  priceTotalCents?: number | null;
  priceColorSurchargeCents?: number;
  priceExtraCharsCents?: number;
  priceExtraCharsCount?: number;
  priceFrameSurchargeCents?: number;
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

  const date = new Date().toLocaleString("nl-NL", {
    dateStyle: "long",
    timeStyle: "short",
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
                </td>
              </tr>
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
                    ${row("Vorm", data.shapeName)}
                    ${row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${row("Kleur", data.colorName)}
                    ${row("Maat", data.sizeName)}
                    ${row("Huisnummer", data.customText)}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${data.orderLabel ? row("Volgorde", data.orderLabel) : ""}
                    ${row("Lettertype", data.fontName)}
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
                    ${row("Datum", date)}
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
