import type { Metadata } from "next";
import { Inter, Fraunces, Bebas_Neue, Playfair_Display } from "next/font/google";
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

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
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
      className={`${inter.variable} ${fraunces.variable} ${bebasNeue.variable} ${playfairDisplay.variable}`}
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
