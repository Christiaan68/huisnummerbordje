interface PaymentExpiredEmailData {
  orderId: number;
  // reason (toegevoegd 30-9-2026): dezelfde mail/knop wordt sinds die datum
  // ook gebruikt als Mollie een betaling als "mislukt" afwijst (bv. een
  // geweigerde creditcard), niet alleen bij een verlopen betaalsessie — zie
  // app/api/admin/report-expired-order/route.ts. Bepaalt alleen de titel/
  // tekst hieronder, de rest van de mail (gegevens, configuratie, "Alsnog
  // betalen"-link) is voor beide gevallen identiek.
  reason: "expired" | "failed";
  contactName: string;
  contactAddress: string;
  contactPostalCode: string;
  contactCity: string;
  shapeName: string;
  finish: "vlak" | "gewelfd";
  // colorName (colorMode "single") vs. earColorName/plateColorName
  // (colorMode "ears-and-plate") — nooit allebei tegelijk gevuld, zelfde
  // opzet als de andere e-mailsjablonen (bv. payment-issue-notification.ts).
  colorName?: string;
  printColorName?: string;
  earColorName?: string;
  plateColorName?: string;
  sizeName: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  priceLabel: string;
  // Link om dezelfde bestelling (NAW + configuratie, zonder opnieuw in te
  // vullen) alsnog te betalen — zie app/api/orders/[id]/retry-payment/
  // route.ts, dat createMolliePaymentForOrder (lib/mollie/client.ts)
  // hergebruikt.
  retryPaymentUrl: string;
  webshopUrl: string;
}

/**
 * Bevestigingsmail aan de klant wanneer een beheerder in het beheertool op
 * "Aan de klant melden" klikt bij een bestelling waarvan de betaling bij
 * Mollie op "verlopen" (toegevoegd 28-9-2026) of "mislukt" (toegevoegd
 * 30-9-2026, op verzoek van Christiaan) staat — zie
 * app/api/admin/report-expired-order/route.ts. Bewust dezelfde warme toon en
 * opmaak als customer-confirmation.ts, met een rustige (niet alarmerende)
 * melding — zie `reason` hierboven voor het enige verschil tussen de twee.
 */
export function renderPaymentExpiredEmail(data: PaymentExpiredEmailData): string {
  const isEarsOrder = Boolean(data.earColorName && data.plateColorName);
  const isExpired = data.reason === "expired";
  const heading = isExpired ? "Je betaling is helaas verlopen" : "Je betaling is helaas niet gelukt";
  const introText = isExpired
    ? `De betaalsessie voor bestelling #${data.orderId} is
                    verlopen voordat de betaling is afgerond — je bestelling
                    is daardoor nog niet bevestigd. Hieronder vind je nog
                    een keer je gegevens en configuratie.`
    : `De betaling voor bestelling #${data.orderId} is helaas niet
                    gelukt — je bestelling is daardoor nog niet bevestigd.
                    Hieronder vind je nog een keer je gegevens en
                    configuratie.`;
  const noticeText = isExpired
    ? "<strong>Betaling verlopen</strong> — er is niets in rekening gebracht."
    : "<strong>Betaling mislukt</strong> — er is niets in rekening gebracht.";

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
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">${heading}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 8px;">
                  <p style="margin:0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    Beste ${data.contactName},
                  </p>
                  <p style="margin:12px 0 0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    ${introText}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf3e6;border:1px solid #e8d9b8;border-radius:6px;">
                    <tr>
                      <td style="padding:14px 18px;color:#5a4a26;font-size:14px;line-height:1.5;">
                        ${noticeText}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Jouw gegevens
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Naam", data.contactName)}
                    ${row("Adres", `${data.contactAddress}, ${data.contactPostalCode} ${data.contactCity}`)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Bestelling #${data.orderId}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Vorm", data.shapeName)}
                    ${isEarsOrder ? "" : row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${
                      isEarsOrder
                        ? row("Ondergrond kleur", data.plateColorName!) +
                          row("Opdruk kleur", data.earColorName!)
                        : (data.colorName ? row("Ondergrond kleur", data.colorName) : "") +
                          (data.printColorName ? row("Opdruk kleur", data.printColorName) : "")
                    }
                    ${row("Maat", data.sizeName)}
                    ${row("Huisnummer", data.customText)}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${row("Totaalprijs", data.priceLabel)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 8px;" align="center">
                  <a
                    href="${data.retryPaymentUrl}"
                    style="display:inline-block;background-color:#1B2A41;color:#f7f5f0;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:6px;"
                  >
                    Alsnog betalen
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 32px 28px;" align="center">
                  <span style="color:#9a9384;font-size:12px;line-height:1.6;">
                    Deze link brengt je direct terug naar de betaalpagina,
                    zonder dat je iets opnieuw hoeft in te vullen. Liever
                    eerst nog even rondkijken?
                    <a href="${data.webshopUrl}" style="color:#6b6558;">Ga naar de webshop</a>.
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
