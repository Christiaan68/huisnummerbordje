interface QuestionConfirmationEmailData {
  // Optioneel: alleen aanwezig als de vraag gesteld is via de configurator
  // (zie components/configurator/QuestionModal.tsx en
  // app/api/contact-question/route.ts) — dan wordt de sectie "Gekozen
  // configuratie" hieronder getoond. Bij een algemene vraag via het
  // contactformulier op /contact/vraag (zie
  // app/api/contact-question-general/route.ts) zijn deze velden allemaal
  // afwezig en wordt die sectie overgeslagen. Zelfde opzet als
  // QuestionEmailData in question-notification.ts (de interne meldingsmail
  // waar deze klantbevestiging het tegenhangertje van is).
  shapeName?: string;
  finish?: "vlak" | "gewelfd";
  colorName?: string;
  printColorName?: string;
  earColorName?: string;
  plateColorName?: string;
  sizeName?: string;
  customText?: string;
  extraLine1?: string;
  extraLine2?: string;
  numberFontName?: string;
  line1FontName?: string;
  line2FontName?: string;
  askerName: string;
  askerEmail: string;
  question: string;
  // Optioneel ingevuld door de bezoeker — alleen getoond als ze ook echt
  // zijn ingevuld (zelfde velden als question-notification.ts).
  askerPhone?: string;
  askerAddress?: string;
  askerPostalCode?: string;
  askerCity?: string;
}

/**
 * Bevestigingsmail aan de bezoeker zelf die een vraag heeft gesteld — via de
 * pop-up in de configurator (met configuratie erbij) of via het algemene
 * contactformulier op /contact/vraag (zonder configuratie). Toegevoegd
 * 28-9-2026 op verzoek van Christiaan: op elke plek waar een klant een
 * vraag kan stellen, moet die klant ook zelf een bevestiging terugkrijgen
 * (met adresgegevens en configuratie erbij, als die er zijn) — tot dan toe
 * ging er alleen een interne melding naar Christiaan
 * (renderQuestionNotificationEmail in question-notification.ts), nooit een
 * bevestiging terug naar de vraagsteller. Bewust dezelfde warme toon als
 * customer-confirmation.ts (de bestelbevestiging), geen technisch overzicht.
 */
export function renderQuestionConfirmationEmail(
  data: QuestionConfirmationEmailData
): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#6b6558;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#1a1a1a;font-size:14px;text-align:right;font-weight:600;">${value}</td>
    </tr>
  `;

  const hasConfiguration = Boolean(data.shapeName);
  const hasExtraDetails = Boolean(
    data.askerPhone || data.askerAddress || data.askerPostalCode || data.askerCity
  );

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
                  <span style="color:#f7f5f0;font-size:18px;font-weight:600;">We hebben je vraag ontvangen</span>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 8px;">
                  <p style="margin:0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    Beste ${data.askerName},
                  </p>
                  <p style="margin:12px 0 0;color:#1a1a1a;font-size:15px;line-height:1.6;">
                    Bedankt voor je bericht. We hebben je vraag in goede orde
                    ontvangen en nemen zo snel mogelijk contact met je op.
                    Hieronder vind je, voor de zekerheid, een overzicht van
                    wat je hebt ingestuurd.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 0;">
                  <span style="color:#1B2A41;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">
                    Jouw vraag
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
                    Jouw gegevens
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px ${hasConfiguration || hasExtraDetails ? "0" : "24px"};">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Naam", data.askerName)}
                    ${row("E-mail", data.askerEmail)}
                    ${data.askerPhone ? row("Telefoon", data.askerPhone) : ""}
                    ${data.askerAddress ? row("Adres", data.askerAddress) : ""}
                    ${
                      data.askerPostalCode || data.askerCity
                        ? row(
                            "Postcode/plaats",
                            [data.askerPostalCode, data.askerCity].filter(Boolean).join(" ")
                          )
                        : ""
                    }
                  </table>
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
                <td style="padding:12px 32px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row("Vorm", data.shapeName ?? "")}
                    ${data.finish ? row("Afwerking", data.finish === "vlak" ? "Vlak" : "Gewelfd") : ""}
                    ${data.colorName ? row("Ondergrond kleur", data.colorName) : ""}
                    ${data.printColorName ? row("Opdruk kleur", data.printColorName) : ""}
                    ${data.plateColorName ? row("Ondergrond kleur", data.plateColorName) : ""}
                    ${data.earColorName ? row("Opdruk kleur", data.earColorName) : ""}
                    ${row("Maat", data.sizeName ?? "")}
                    ${row("Huisnummer", data.customText ?? "")}
                    ${data.extraLine1 ? row("Tekstregel 1", data.extraLine1) : ""}
                    ${data.extraLine2 ? row("Tekstregel 2", data.extraLine2) : ""}
                    ${data.numberFontName ? row("Lettertype huisnummer", data.numberFontName) : ""}
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
                    Dit is nog geen bestelling — je hebt alleen een vraag
                    gesteld. Wil je nog iets toevoegen? Reageer gerust op
                    deze e-mail.
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
