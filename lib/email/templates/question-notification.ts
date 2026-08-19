interface QuestionEmailData {
  shapeName: string;
  finish: "vlak" | "gewelfd";
  colorName: string;
  sizeName: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  fontName: string;
  askerName: string;
  askerEmail: string;
  question: string;
}

/**
 * Bouwt de HTML-inhoud van de e-mail die Christiaan ontvangt wanneer een
 * bezoeker via de configurator een vraag stelt (zie
 * components/configurator/QuestionModal.tsx en
 * app/api/contact-question/route.ts). Zelfde opzet als
 * configuration-confirmation.ts: alle styling staat inline, omdat
 * e-mailclients geen Tailwind/externe CSS ondersteunen.
 */
export function renderQuestionNotificationEmail(data: QuestionEmailData): string {
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
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">Nieuwe vraag vanuit de configurator</span>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Vraagsteller
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Naam", data.askerName)}
                    ${row("E-mail", data.askerEmail)}
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
                    Gekozen configuratie (bij deze vraag)
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Vorm", data.shapeName)}
                    ${row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${row("Kleur", data.colorName)}
                    ${row("Maat", data.sizeName)}
                    ${row("Huisnummer", data.customText)}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${row("Lettertype", data.fontName)}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 32px 28px;">
                  <span style="color:#9a9384;font-size:12px;">
                    Dit is nog geen bestelling — de bezoeker heeft alleen een vraag gesteld. Je kunt direct op deze e-mail antwoorden, dat gaat naar ${data.askerEmail}.
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
