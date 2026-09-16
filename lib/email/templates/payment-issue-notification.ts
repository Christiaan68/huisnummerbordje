interface PaymentIssueEmailData {
  orderId: number;
  paymentStatusLabel: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress: string;
  contactPostalCode: string;
  contactCity: string;
  shapeName: string;
  finish: "vlak" | "gewelfd";
  // colorName (colorMode "single") vs. earColorName/plateColorName
  // (colorMode "ears-and-plate") — nooit allebei tegelijk gevuld, zie ook
  // lib/email/templates/question-notification.ts voor hetzelfde patroon.
  colorName?: string;
  earColorName?: string;
  plateColorName?: string;
  sizeName: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  priceLabel: string;
  question: string;
}

/**
 * Bouwt de HTML-inhoud van de e-mail die naar het adres gaat dat in de
 * prijstool is ingesteld onder "Vraag betaalprobleem naar"
 * (payment_issue_notification) — verstuurd vanaf de bedankt-pagina
 * (app/bestelling/bedankt/page.tsx, via components/order/
 * PaymentIssueContact.tsx en app/api/payment-issue/route.ts) wanneer een
 * klant, terwijl zijn betaling nog verwerkt wordt, een vraag stelt over
 * zijn bestelling. Toegevoegd 16-9-2026, op verzoek van Christiaan. Zelfde
 * opzet als question-notification.ts: alle styling staat inline, omdat
 * e-mailclients geen Tailwind/externe CSS ondersteunen.
 */
export function renderPaymentIssueNotificationEmail(data: PaymentIssueEmailData): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#6b6558;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">${value}</td>
    </tr>
  `;

  // Zelfde tijdzone-correctie als in question-notification.ts.
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
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">
                    Vraag over bestelling #${data.orderId} (betaling ${data.paymentStatusLabel})
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Klant
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Naam", data.contactName)}
                    ${row("E-mail", data.contactEmail)}
                    ${data.contactPhone ? row("Telefoon", data.contactPhone) : ""}
                    ${row("Adres", `${data.contactAddress}, ${data.contactPostalCode} ${data.contactCity}`)}
                    ${row("Datum", date)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Vraag
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <p style="margin:0;padding:14px 16px;background-color:#f7f5f0;border-radius:4px;color:#1a1a1a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.question}</p>
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
                <td style="padding:12px 32px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Betaalstatus", data.paymentStatusLabel)}
                    ${row("Vorm", data.shapeName)}
                    ${row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${data.colorName ? row("Kleur", data.colorName) : ""}
                    ${data.earColorName ? row("Kleur oren", data.earColorName) : ""}
                    ${data.plateColorName ? row("Kleur vlak", data.plateColorName) : ""}
                    ${row("Maat", data.sizeName)}
                    ${row("Huisnummer", data.customText)}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${row("Prijs", data.priceLabel)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px;">
                  <span style="color:#9a9384;font-size:12px;">
                    Je kunt direct op deze e-mail antwoorden, dat gaat naar ${data.contactEmail}.
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
