import type { Metadata } from "next";
import {
  Inter,
  Fraunces,
  UnifrakturCook,
  Bodoni_Moda,
  Saira_Stencil_One,
  Tinos,
  Roboto_Condensed,
  Pinyon_Script,
} from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ConsentPreferencesModal } from "@/components/consent/ConsentPreferencesModal";
import { CONSENT_COOKIE_NAME, parseConsentCookie } from "@/lib/consent/consent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

// De 6 lettertypes hieronder zijn de volledige huidige lijst uit
// config/product-options.ts (`productFonts`) — de eerste 5 op 28-8-2026
// toegevoegd op verzoek van Christiaan, ter vervanging van de
// oorspronkelijke 4 systeemlettertypes ("Klassiek"/Georgia, "Modern"/
// Helvetica, "Industrieel"/Bebas Neue, "Elegant"/Playfair Display), die
// dezelfde dag weer verwijderd zijn. Voor een deel ervan was het gevraagde
// lettertype zelf niet (gratis) beschikbaar; in dat geval wordt hieronder
// een gratis Google Font gebruikt die er in stijl dicht bij komt — de
// klant ziet in de configurator gewoon de gevraagde naam (zie
// config/product-options.ts), niet de naam van het vervangende lettertype:
// - "Fette Fraktur" (Duitse gotische druletter) → UnifrakturCook, enige
//   vetgedrukte ("fette") blackletter-google font.
// - "Bodoni" → Bodoni Moda, een moderne Google Fonts-eigen doorontwikkeling
//   van Bodoni's originele 18e-eeuwse ontwerp (geen vervanger nodig, dit IS
//   in feite een Bodoni-lettertype).
// - "Colonel" → Saira Stencil One, gekozen (i.o.m. Christiaan, na overleg
//   over Colonel's betaalde 205TF-licentie) als gratis vervanger met een
//   vergelijkbare strakke, geometrische stencil-uitstraling.
// - "Times" → Tinos, Google's gratis, metrisch compatibele vervanger voor
//   Times New Roman.
// - "Schwitserland Schmal" → Roboto Condensed, als gratis vervanger voor
//   een smal/condensed "Zwitsers" schriftbeeld (vergelijkbaar met het
//   type letter dat eerder "Industrieel"/Bebas Neue invulde, maar dan
//   condensed in plaats van extra-condensed/all-caps).
// - "Commercial Script" (31-8-2026 toegevoegd) → Pinyon Script, een
//   sierlijk, verbonden Google Font in de stijl van een handgeschreven
//   "commercial script"-kalligrafie (net als de vorige 3 vervangingen: de
//   klant ziet de naam "Commercial Script", niet "Pinyon Script"). OFL-
//   gelicentieerd (net als alle andere Google Fonts hier), gecontroleerd
//   via Googles eigen "google/fonts"-repository op GitHub. Bijzonderheid:
//   Pinyon Script bestaat bij Google Fonts alleen in het gewicht Regular
//   (400) — er is geen vette (700) variant, in tegenstelling tot de
//   andere 5 lettertypes. Daarom hieronder ook alleen weight: "400"
//   opgevraagd; de plekken waar de preview/e-mailafbeelding normaal altijd
//   vet (700) tekent, houden voor dit ene lettertype rekening met die
//   uitzondering — zie FONT_WEIGHT_BY_ID in lib/configuration/plate-visual.ts.
//
// Al deze 6 lettertypes worden HIER zelf gehost via next/font/google —
// dezelfde fontbestanden worden dus zowel in de live preview als in de
// e-mailafbeelding gebruikt (zie lib/email/plate-preview-image.tsx), in
// tegenstelling tot de oude "Klassiek"/"Modern" waar de e-mailafbeelding
// nog een apart vervangend lettertype nodig had omdat die twee zelf
// systeemlettertypes waren.
const unifrakturCook = UnifrakturCook({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-fette-fraktur",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

const sairaStencilOne = Saira_Stencil_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-colonel",
  display: "swap",
});

const tinos = Tinos({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-times",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-roboto-condensed",
  display: "swap",
});

// Pinyon Script bestaat bij Google Fonts alleen in gewicht 400 (Regular) —
// zie de toelichting hierboven. next/font/google zou een foutmelding geven
// bij het opvragen van een niet-bestaand gewicht (bv. "700"), vandaar hier
// bewust alleen "400".
const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-commercial-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Geëmailleerde Huisnummerbordjes | Duurzaam. Opvallend. Authentiek.",
  description:
    "Ontwerp jouw eigen gepersonaliseerde geëmailleerde huisnummerbordje. Duurzaam, opvallend en authentiek — gemaakt om jarenlang mee te gaan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gelezen, zodat er bij een bezoeker die al eerder een
  // cookiekeuze maakte geen flits van de cookiebanner ontstaat (zie
  // components/consent/ConsentProvider.tsx voor de volledige toelichting).
  const consentCookieRaw = cookies().get(CONSENT_COOKIE_NAME)?.value ?? null;
  const initialAnalyticsGranted =
    parseConsentCookie(consentCookieRaw)?.analytics === true;

  return (
    <html
      lang="nl"
      className={`${inter.variable} ${fraunces.variable} ${unifrakturCook.variable} ${bodoniModa.variable} ${sairaStencilOne.variable} ${tinos.variable} ${robotoCondensed.variable} ${pinyonScript.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        {/* Google Consent Mode — standaardstatus, toegevoegd 27-8-2026 in
            het kader van de AVG/cookie-aanpassing (zie
            claude/project-tijdlijn.md). Moet vóór alle andere scripts
            draaien, vandaar strategy="beforeInteractive": zet alle vier
            de consent-signalen standaard op 'denied' vóórdat de
            Google Analytics-tag (hieronder, via ConsentProvider) ook
            maar de kans krijgt om te initialiseren. Geeft een reeds
            bekende toestemming (uit de cookie hierboven) meteen door,
            zodat een terugkerende bezoeker die eerder al akkoord ging
            gewoon meteen gemeten wordt. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ window.dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              wait_for_update: 500
            });
            ${
              initialAnalyticsGranted
                ? "gtag('consent', 'update', { analytics_storage: 'granted' });"
                : ""
            }
          `}
        </Script>

        <ConsentProvider initialConsentRaw={consentCookieRaw}>
          {children}
          <ConsentBanner />
          <ConsentPreferencesModal />
        </ConsentProvider>
      </body>
    </html>
  );
}
