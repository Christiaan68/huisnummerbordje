import { formatPriceCents } from "@/lib/configuration/pricing";

interface CustomerConfirmationData {
  contactName: string;
  shapeName: string;
  finish: "vlak" | "gewelfd";
  colorName: string;
  sizeName: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  fontName: string;
  hasFrame?: boolean;
  quantity: string;
  orderLabel?: string;
  // Content-id van de bijgevoegde voorbeeldafbeelding van het bordje (zie
  // app/api/send-email/route.ts / lib/email/plate-preview-image.tsx).
  // Onbekend/leeg (bv. omdat het genereren onverhoopt mislukt is) → geen
  // afbeelding tonen, de rest van de mail blijft gewoon werken.
  previewImageCid?: string;
  // Prijs — zie lib/configuration/pricing.ts. priceTotalCents is null
  // wanneer er (nog) geen prijs bekend is voor deze maat/afwerking.
  priceTotalCents?: number | null;
  priceColorSurchargeCents?: number;
  priceExtraCharsCents?: number;
  priceExtraCharsCount?: number;
  priceFrameSurchargeCents?: number;
}

/**
 * Bevestigingsmail voor de klant zelf. Bewust een andere, warmere toon dan
 * de interne meldingsmail — dit is een "bedankt voor je bestelling"-mail,
 * geen technisch overzicht.
 */
export function renderCustomerConfirmationEmail(
  data: CustomerConfirmationData
): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#6b6558;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">${value}</td>
    </tr>
  `;

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
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">Bedankt voor je bestelling!</span>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 8px;">
                  <p style="margin:0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    Beste ${data.contactName},
                  </p>
                  <p style="margin:12px 0 0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    We hebben je configuratie voor een geëmailleerd huisnummerbordje
                    in goede orde ontvangen. Hieronder vind je een overzicht van
                    jouw keuzes. We nemen zo snel mogelijk contact met je op.
                  </p>
                </td>
              </tr>
              ${
                data.previewImageCid
                  ? `
              <tr>
                <td style="padding:0 32px 8px;" align="center">
                  <img
                    src="cid:${data.previewImageCid}"
                    alt="Voorbeeld van je geconfigureerde huisnummerbordje"
                    width="320"
                    style="display:block;max-width:320px;width:100%;height:auto;border-radius:6px;"
                  />
                </td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding:16px 32px 24px;">
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
                    ${data.hasFrame ? row("Kader", "Ja") : ""}
                    ${row("Aantal", data.quantity)}
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
                    ${
                      data.priceFrameSurchargeCents
                        ? row("Meerprijs kader", formatPriceCents(data.priceFrameSurchargeCents))
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
                <td style="padding:0 32px 28px;">
                  <span style="color:#9a9384;font-size:12px;">
                    Heb je vragen over je bestelling? Reageer gerust op deze e-mail.
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
