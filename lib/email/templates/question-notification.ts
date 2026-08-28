interface QuestionEmailData {
  // Optioneel: alleen aanwezig als de vraag gesteld is via de configurator
  // (met een configuratie in uitvoering, zie
  // components/configurator/QuestionModal.tsx en
  // app/api/contact-question/route.ts) — dan wordt de sectie "Gekozen
  // configuratie" hieronder getoond. Bij een algemene vraag via het
  // contactformulier op /contact/vraag (zie
  // app/api/contact-question-general/route.ts) zijn deze velden allemaal
  // afwezig en wordt die sectie overgeslagen.
  shapeName?: string;
  finish?: "vlak" | "gewelfd";
  colorName?: string;
  sizeName?: string;
  customText?: string;
  extraLine1?: string;
  extraLine2?: string;
  // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype (zie
  // types/configuration.ts) — line1FontName/line2FontName zijn alleen
  // gezet als die tekstregel bestaat.
  numberFontName?: string;
  line1FontName?: string;
  line2FontName?: string;
  askerName: string;
  askerEmail: string;
  question: string;
}

/**
 * Bouwt de HTML-inhoud van de e-mail die naar het adres gaat dat in de
 * prijstool is ingesteld onder "Vraag klant naar" — zowel wanneer een
 * bezoeker via de configurator een vraag stelt (met configuratie erbij,
 * zie components/configurator/QuestionModal.tsx en
 * app/api/contact-question/route.ts) als wanneer iemand het algemene
 * contactformulier op /contact/vraag gebruikt (zonder configuratie, zie
 * app/api/contact-question-general/route.ts). Zelfde opzet als
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

  const hasConfiguration = Boolean(data.shapeName);

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
                    ${hasConfiguration ? "Nieuwe vraag vanuit de configurator" : "Nieuwe vraag via het contactformulier"}
                  </span>
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
                <td style="padding:12px 32px ${hasConfiguration ? "0" : "24px"};">
                  <p style="margin:0;padding:14px 16px;background-color:#f7f5f0;border-radius:4px;color:#1a1a1a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.question}</p>
                </td>
              </tr>
              ${
                hasConfiguration
                  ? `
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
                    ${row("Vorm", data.shapeName ?? "")}
                    ${row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd")}
                    ${row("Kleur", data.colorName ?? "")}
                    ${row("Maat", data.sizeName ?? "")}
                    ${row("Huisnummer", data.customText ?? "")}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${row("Lettertype huisnummer", data.numberFontName ?? "")}
                    ${data.line1FontName ? row("Lettertype tekstregel 1", data.line1FontName) : ""}
                    ${data.line2FontName ? row("Lettertype tekstregel 2", data.line2FontName) : ""}
                  </table>
                </td>
              </tr>
              `
                  : ""
              }
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
