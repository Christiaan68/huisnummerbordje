import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { companyInfo, siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Cookiebeleid | Emaille Huisnummers",
  description: "Welke cookies Emaille Huisnummers gebruikt en waarom.",
};

// Cookiebeleid, toegevoegd 27-8-2026 in het kader van de AVG/cookie-
// aanpassing (zie claude/project-tijdlijn.md). De inhoud is uitsluitend
// gebaseerd op een daadwerkelijke code-inventarisatie van de webshop op
// diezelfde datum — er staat hier geen enkele cookie, dienst of
// bewaartermijn die niet ook echt in de code is aangetroffen of
// (voor de _ga-cookies) rechtstreeks door Google zelf gedocumenteerd is.
// Zelfde opzet (achtergrond/Header/Footer/stijl) als de andere
// tekstpagina's, zie app/leveringsvoorwaarden/page.tsx.
export default function CookiebeleidPage() {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${siteContent.hero.backgroundImage})` }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/85 to-background"
        aria-hidden="true"
      />

      <Header showConfiguratorLink={false} />

      <main className="relative mx-auto max-w-2xl px-6 pb-20 pt-32 sm:pt-40">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Cookiebeleid
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versie: augustus 2026
        </p>

        <p className="mt-4 text-sm leading-relaxed text-foreground">
          Deze webshop gebruikt cookies en vergelijkbare technieken. Een
          cookie is een klein tekstbestandje dat bij een bezoek aan een
          website op je apparaat wordt opgeslagen. Hieronder lees je welke
          cookies wij gebruiken, waarvoor, en hoe je jouw keuze kunt
          wijzigen of intrekken.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            1. Noodzakelijke cookies
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Deze cookie is nodig om de webshop goed te laten werken en
            wordt altijd geplaatst, ook zonder jouw toestemming — dat mag
            volgens de cookiewetgeving voor cookies die strikt noodzakelijk
            zijn voor de werking van de website.
          </p>
          <div className="mt-4 overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Naam
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Doel
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Bewaartermijn
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-foreground">
                    cookievoorkeur
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    Onthoudt of je analytische cookies hebt geaccepteerd, zodat
                    de cookiemelding niet bij ieder bezoek opnieuw verschijnt.
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    180 dagen
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            2. Analytische cookies
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Met jouw toestemming gebruiken we Google Analytics 4 om te
            begrijpen hoe bezoekers onze webshop gebruiken (bijvoorbeeld
            welke pagina&apos;s bezocht worden), zodat we deze kunnen
            verbeteren. Deze cookies worden pas geplaatst nadat je hiervoor
            toestemming hebt gegeven via de cookiemelding of het
            cookie-voorkeurenscherm.
          </p>
          <div className="mt-4 overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Naam
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Doel
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Bewaartermijn
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-foreground">
                    _ga
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    Onderscheidt unieke bezoekers van elkaar.
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    Standaard 2 jaar (door Google zo ingesteld). Sommige
                    browsers korten dit zelf al in, bijvoorbeeld tot
                    maximaal 400 dagen in Chrome of circa 7 dagen in
                    Safari.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-foreground">
                    _ga_2NLDPWQQ92
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    Onthoudt de status van je bezoek (sessie) aan de webshop.
                  </td>
                  <td className="px-4 py-2.5 align-top text-muted-foreground">
                    Standaard 2 jaar, met dezelfde browserbeperkingen als
                    hierboven.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            Google Analytics 4 wordt aangeboden door Google Ireland
            Limited (onderdeel van Google LLC). Gegevens kunnen door
            Google verwerkt worden op servers buiten de Europese
            Economische Ruimte. Meer informatie hierover is te vinden in
            het{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              privacybeleid van Google
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            3. Marketingcookies
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Deze webshop gebruikt op dit moment geen marketing- of
            advertentiecookies (zoals bijvoorbeeld van Google Ads, Meta of
            TikTok). Mocht dat in de toekomst veranderen, dan werken we
            deze cookieverklaring en het cookie-voorkeurenscherm daarop bij.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            4. Je keuze wijzigen of intrekken
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Je kunt je cookievoorkeuren op elk moment wijzigen of je
            toestemming intrekken via &ldquo;Cookie-instellingen&rdquo;
            onderaan iedere pagina van deze webshop. Zodra je analytische
            cookies uitzet, worden ook eventueel al geplaatste
            Analytics-cookies actief verwijderd en stopt het meten.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Daarnaast kun je cookies altijd zelf beheren of verwijderen via
            de instellingen van je browser.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            5. Meer weten
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Voor meer informatie over hoe we in bredere zin met je
            persoonsgegevens omgaan, zie onze{" "}
            <Link
              href="/privacyverklaring"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              privacyverklaring
            </Link>
            .
          </p>
        </section>

        <div className="mt-12 space-y-1 border-t border-border/60 pt-8 text-left text-sm leading-relaxed text-foreground">
          <p className="font-medium">{companyInfo.name}</p>
          <p>{companyInfo.street}</p>
          <p>
            {companyInfo.postalCode} {companyInfo.city}
          </p>
          <p className="mt-3 text-muted-foreground">KvK: {companyInfo.kvkNumber}</p>
          <p className="text-muted-foreground">
            Btw-identificatienummer: {companyInfo.vatNumber}
          </p>
          <p className="mt-3">
            E-mail:{" "}
            <a
              href={`mailto:${companyInfo.email}`}
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              {companyInfo.email}
            </a>
          </p>
          <p>Telefoon: {companyInfo.phone}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
