import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTopButton } from "@/components/layout/BackToTopButton";
import { companyInfo, siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Privacyverklaring | Emaille Huisnummers",
  description: "Hoe Emaille Huisnummers omgaat met persoonsgegevens.",
};

// Privacyverklaring, toegevoegd 27-8-2026 op verzoek van Christiaan. Basis
// is de bestaande privacyverklaring van Langcat Emaille
// (https://www.langcat.nl/privacyverklaring/, laatst bijgewerkt 20-2-2026)
// — zelfde bedrijf, zelfde structuur en toon. Op Christiaans uitdrukkelijke
// verzoek NIET woord-voor-woord overgenomen, maar aangevuld met wat déze
// webshop specifiek doet (bestelgegevens, Google Analytics, de externe
// diensten die de webshop gebruikt) — en waar de webshop een strenger
// standpunt inneemt dan de algemene Langcat-tekst (bijvoorbeeld:
// analytische cookies pas ná toestemming, in plaats van de vagere
// "privacyvriendelijke statistieken"-formulering van het origineel) is dat
// strengere, webshop-eigen standpunt aangehouden. Zie ook
// claude/avg-cookieproof-ga4.md voor de volledige achtergrond, en
// app/cookiebeleid/page.tsx voor het cookie-specifieke deel (waar deze
// verklaring naar verwijst i.p.v. alles te dupliceren).
export default function PrivacyverklaringPage() {
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
          Privacyverklaring
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versie: augustus 2026
        </p>

        <p className="mt-4 text-sm leading-relaxed text-foreground">
          Deze privacyverklaring geldt voor deze webshop van Emaille
          Huisnummers, een activiteit van {companyInfo.name}. Hierin lees je
          welke persoonsgegevens we verwerken, waarvoor, en welke rechten je
          hebt.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            1. Wie zijn wij?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {companyInfo.name} is verantwoordelijk voor de verwerking van
            persoonsgegevens via deze webshop.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {companyInfo.street}
            <br />
            {companyInfo.postalCode} {companyInfo.city}
            <br />
            KvK: {companyInfo.kvkNumber} — Btw-identificatienummer:{" "}
            {companyInfo.vatNumber}
            <br />
            E-mail:{" "}
            <a
              href={`mailto:${companyInfo.email}`}
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              {companyInfo.email}
            </a>{" "}
            — Telefoon: {companyInfo.phone}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            2. Welke persoonsgegevens verwerken wij?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            <span className="font-medium">Bestelgegevens.</span> Wanneer je
            via de configurator een bestelling plaatst, verwerken we je
            naam, adres, postcode, woonplaats, e-mailadres, telefoonnummer
            (indien opgegeven), en de door jou gekozen configuratie van het
            bordje (vorm, maat, kleur, lettertype, tekst en aantal).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            <span className="font-medium">Contactverzoeken.</span> Stel je
            een vraag via het contactformulier, dan verwerken we de
            gegevens die je daarin invult (zoals naam, e-mailadres en je
            bericht).
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            <span className="font-medium">Technische gegevens.</span>{" "}
            Zoals bij vrijwel elke website worden bepaalde technische
            gegevens (zoals IP-adres) kortstondig verwerkt door onze
            hostingpartij, nodig voor het functioneren en beveiligen van de
            webshop.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            <span className="font-medium">Website-statistieken.</span> Pas
            nadat je hier expliciet toestemming voor geeft, gebruiken we
            Google Analytics 4 om te zien hoe de webshop wordt gebruikt.
            Zonder die toestemming verzamelen we hierover niets. Zie ons{" "}
            <Link
              href="/cookiebeleid"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              cookiebeleid
            </Link>{" "}
            voor het volledige overzicht.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            3. Waarvoor gebruiken wij deze gegevens?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Om bestellingen te verwerken en te bevestigen, het bordje volgens
            jouw specificaties te (laten) vervaardigen en te verzenden,
            vragen te beantwoorden, en om de webshop technisch te laten
            werken en te beveiligen. Met jouw toestemming ook om de webshop
            te verbeteren op basis van website-statistieken.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            4. Op basis van welke grondslag?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Voor bestelgegevens: de uitvoering van de overeenkomst die je met
            ons aangaat door te bestellen. Voor contactverzoeken: het
            afhandelen van je verzoek. Voor bepaalde administratieve
            gegevens: een wettelijke verplichting (bijvoorbeeld
            fiscale bewaarplicht). Voor analytische cookies: uitsluitend
            jouw toestemming — die je op elk moment kunt intrekken via
            &ldquo;Cookie-instellingen&rdquo; onderaan de pagina.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            5. Bestel- en contactformulieren
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            De gegevens die je invult in de configurator of het
            contactformulier gebruiken we uitsluitend om je bestelling of
            aanvraag te behandelen en om contact met je op te nemen.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            6. Externe partijen die gegevens namens ons verwerken
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Voor het functioneren van de webshop maken we gebruik van de
            volgende externe partijen, die gegevens uitsluitend namens ons
            verwerken:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              <span className="font-medium">Resend</span> — voor het
              versturen van bestel- en bevestigingsmails.
            </li>
            <li>
              <span className="font-medium">TiDB Cloud (MySQL-database)</span>{" "}
              — voor het opslaan van bestellingen.
            </li>
            <li>
              <span className="font-medium">Vercel</span> — voor het hosten
              van de webshop.
            </li>
            <li>
              <span className="font-medium">Google Analytics 4</span> —
              uitsluitend ná jouw toestemming, voor website-statistieken.
              Zie het{" "}
              <Link
                href="/cookiebeleid"
                className="underline decoration-border underline-offset-2 hover:text-primary"
              >
                cookiebeleid
              </Link>
              .
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Lettertypen op deze webshop worden vooraf door onszelf ingeladen
            en meegeleverd (zelf gehost), in plaats van rechtstreeks bij
            Google opgevraagd op het moment dat je de pagina bezoekt — je
            browser legt daarvoor dus geen eigen contact met Google.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            We verstrekken je gegevens nooit aan derden voor eigen gebruik
            van die derden, en verkopen je gegevens nooit.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            7. Cookies
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Voor een volledig overzicht van de cookies die deze webshop
            gebruikt, wanneer, en hoe je je keuze kunt wijzigen of
            intrekken, zie ons{" "}
            <Link
              href="/cookiebeleid"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              cookiebeleid
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            8. Bewaartermijnen
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            We bewaren gegevens niet langer dan nodig. Bestelgegevens
            bewaren we zolang nodig is voor de afhandeling van je
            bestelling, eventuele garantie of klachten, en zolang de
            wettelijke (fiscale) bewaarplicht voor administratieve gegevens
            dat vereist — in Nederland doorgaans 7 jaar. Gegevens uit
            contactverzoeken bewaren we zolang nodig is om je vraag af te
            handelen. Voor de bewaartermijnen van analytische cookies, zie
            ons{" "}
            <Link
              href="/cookiebeleid"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              cookiebeleid
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            9. Jouw rechten
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Je hebt het recht op inzage, correctie of verwijdering van je
            persoonsgegevens, en het recht om bezwaar te maken tegen de
            verwerking ervan of om beperking of overdraagbaarheid van je
            gegevens te vragen. Neem hiervoor contact met ons op via{" "}
            <a
              href={`mailto:${companyInfo.email}`}
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              {companyInfo.email}
            </a>
            . Je hebt ook het recht om een klacht in te dienen bij de{" "}
            <a
              href="https://www.autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              Autoriteit Persoonsgegevens
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            10. Beveiliging
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            We nemen passende maatregelen om misbruik, verlies, onbevoegde
            toegang en andere ongewenste verwerking van persoonsgegevens
            tegen te gaan.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            11. Wijzigingen
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De
            meest actuele versie is altijd via deze pagina beschikbaar.
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
      <BackToTopButton />
    </div>
  );
}
