import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { companyInfo, siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Leveringsvoorwaarden | Emaille Huisnummers",
  description: "Leveringsvoorwaarden van Emaille Huisnummers.",
};

// Volledige tekst van de leveringsvoorwaarden, aangeleverd door Christiaan
// op 25-8-2026 (versie augustus 2026) — vervangt de eerdere lege
// placeholder-pagina (19-8-2026). Zelfde opzet (achtergrond/Header/Footer)
// als de andere pagina's van de webshop, zie app/contact/page.tsx. De
// bedrijfsgegevens onderaan komen, waar de tekst dat toelaat, uit
// config/site-content.ts (companyInfo) i.p.v. hardcoded, zodat ze in sync
// blijven met de contactpagina.
export default function LeveringsvoorwaardenPage() {
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
          Leveringsvoorwaarden
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Versie: augustus 2026
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground">
          Deze leveringsvoorwaarden zijn van toepassing op bestellingen via
          de webshop van Huisnummerbordjes, onderdeel van Langcat Emaille,
          gevestigd te Laag Soeren, ingeschreven bij de Kamer van Koophandel
          onder nummer 98200194, hierna te noemen: &ldquo;verkoper&rdquo;.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 1 &ndash; Toepasselijkheid
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Deze leveringsvoorwaarden zijn van toepassing op iedere
              bestelling en overeenkomst tussen verkoper en een klant die
              via de webshop van verkoper tot stand komt.
            </li>
            <li>
              Onder &ldquo;klant&rdquo; wordt in deze voorwaarden verstaan
              iedere natuurlijke persoon of rechtspersoon die een bestelling
              plaatst. Voor consumenten gelden daarnaast de
              dwingendrechtelijke bepalingen van het Nederlandse en
              Europese consumentenrecht.
            </li>
            <li>
              Indien een bepaling uit deze voorwaarden in strijd is met
              dwingend consumentenrecht, heeft de wettelijke regeling
              voorrang.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 2 &ndash; Producten en maatwerk
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Verkoper vervaardigt ge&euml;mailleerde huisnummerbordjes en
              eventueel daarmee samenhangende producten.
            </li>
            <li>
              Huisnummerbordjes worden vervaardigd aan de hand van de door
              de klant bij de bestelling opgegeven specificaties. Hieronder
              kunnen onder andere vallen:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>huisnummer;</li>
                <li>toevoegingen aan het huisnummer;</li>
                <li>tekst;</li>
                <li>afmetingen;</li>
                <li>vorm;</li>
                <li>kleurstelling;</li>
                <li>lettertype of typografie;</li>
                <li>gaten, bevestigingswijze of andere gekozen opties.</li>
              </ul>
            </li>
            <li>
              De klant is verantwoordelijk voor de juistheid en volledigheid
              van de door hem opgegeven gegevens en specificaties.
            </li>
            <li>
              De klant dient v&oacute;&oacute;r het afronden van de
              bestelling zorgvuldig te controleren of onder andere het
              huisnummer, eventuele toevoegingen, tekst, kleuren en overige
              gekozen opties juist zijn.
            </li>
            <li>
              Indien verkoper v&oacute;&oacute;r de productie een ontwerp,
              digitale proef of orderbevestiging ter goedkeuring toestuurt,
              is de klant verantwoordelijk voor het zorgvuldig controleren
              daarvan.
            </li>
            <li>
              Een door de klant goedgekeurde ontwerp- of zetfout die
              overeenkomt met de door de klant opgegeven of goedgekeurde
              gegevens, geldt in beginsel niet als een gebrek aan het
              product.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 3 &ndash; Totstandkoming van de overeenkomst
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              De overeenkomst komt tot stand nadat de klant de bestelling
              heeft geplaatst en verkoper de bestelling elektronisch heeft
              bevestigd, tenzij uitdrukkelijk anders wordt aangegeven.
            </li>
            <li>
              Verkoper verstrekt na het plaatsen van de bestelling een
              bevestiging van de overeenkomst op een duurzame
              gegevensdrager, bijvoorbeeld per e-mail.
            </li>
            <li>
              Indien verkoper redelijkerwijs niet in staat is de bestelling
              volgens de opgegeven specificaties uit te voeren, neemt
              verkoper zo spoedig mogelijk contact op met de klant.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 4 &ndash; Prijzen en verzendkosten
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Alle aan consumenten getoonde prijzen zijn inclusief btw,
              tenzij uitdrukkelijk anders vermeld.
            </li>
            <li>
              Eventuele verzend-, verpakkings- of andere bijkomende kosten
              worden v&oacute;&oacute;r het definitief plaatsen van de
              bestelling duidelijk aan de klant meegedeeld.
            </li>
            <li>
              De klant is uitsluitend gehouden tot betaling van kosten
              waarvan hij v&oacute;&oacute;r het sluiten van de
              overeenkomst duidelijk op de hoogte is gesteld.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 5 &ndash; Levertijd
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              De bij het product of tijdens het bestelproces vermelde
              levertijd is de verwachte of overeengekomen levertijd.
            </li>
            <li>
              Omdat de huisnummerbordjes speciaal voor de klant worden
              vervaardigd, kan sprake zijn van een productietermijn
              voordat de bestelling wordt verzonden.
            </li>
            <li>
              Verkoper informeert de klant v&oacute;&oacute;r het sluiten
              van de overeenkomst over de toepasselijke of verwachte
              levertermijn.
            </li>
            <li>
              Tenzij een andere leveringstermijn is overeengekomen, wordt
              de bestelling uiterlijk binnen 30 dagen na het sluiten van de
              overeenkomst geleverd.
            </li>
            <li>
              Indien levering binnen de overeengekomen termijn niet
              mogelijk is, informeert verkoper de klant daarover zo
              spoedig mogelijk.
            </li>
            <li>
              Wanneer verkoper niet binnen de overeengekomen termijn
              levert, kan de consument verkoper, voor zover wettelijk
              vereist, een passende aanvullende termijn voor levering
              geven. Indien levering ook binnen die aanvullende termijn
              uitblijft, kan de consument de overeenkomst ontbinden.
            </li>
            <li>
              Een aanvullende termijn is niet vereist wanneer uit de
              omstandigheden blijkt dat verkoper niet zal leveren of
              wanneer levering op het overeengekomen tijdstip essentieel
              was en dit v&oacute;&oacute;r het sluiten van de
              overeenkomst aan verkoper duidelijk is gemaakt.
            </li>
            <li>
              Bij een rechtsgeldige ontbinding wegens niet-tijdige levering
              worden reeds betaalde bedragen overeenkomstig de wettelijke
              regels terugbetaald.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 6 &ndash; Verzending en aflevering
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              De bestelling wordt geleverd op het door de klant tijdens het
              bestelproces opgegeven afleveradres.
            </li>
            <li>
              De klant is verantwoordelijk voor het juist en volledig
              invullen van het afleveradres.
            </li>
            <li>
              Indien een bestelling door een foutief of onvolledig door de
              klant opgegeven adres niet kan worden afgeleverd, mag
              verkoper de redelijke kosten van een nieuwe verzending aan de
              klant doorberekenen, voor zover dit wettelijk is toegestaan.
            </li>
            <li>Verkoper mag voor de bezorging gebruikmaken van een externe vervoerder.</li>
            <li>
              Het risico van beschadiging of verlies tijdens het transport
              blijft bij verkoper totdat de klant, of een door de klant
              aangewezen derde die niet de vervoerder is, het product
              heeft ontvangen.
            </li>
            <li>
              Indien de klant zelf een vervoerder inschakelt die niet door
              verkoper als bezorgmogelijkheid is aangeboden, gaat het
              risico over overeenkomstig de daarvoor geldende wettelijke
              regels.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 7 &ndash; Controle na ontvangst en transportschade
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              De klant wordt verzocht het geleverde product na ontvangst
              zo spoedig mogelijk te controleren.
            </li>
            <li>
              Zichtbare transportschade of een onjuist geleverd product kan
              het beste zo spoedig mogelijk aan verkoper worden gemeld, bij
              voorkeur voorzien van foto&rsquo;s van het product en de
              verpakking.
            </li>
            <li>
              Het niet onmiddellijk melden van een gebrek doet geen afbreuk
              aan de wettelijke rechten van een consument. Een consument
              behoudt zijn wettelijke rechten wanneer een product niet aan
              de overeenkomst voldoet.
            </li>
            <li>
              Wanneer sprake is van schade waarvoor verkoper
              verantwoordelijk is, zorgt verkoper overeenkomstig de
              wettelijke regels voor een passende oplossing.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 8 &ndash; Geen herroepingsrecht bij gepersonaliseerd
            maatwerk
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              De huisnummerbordjes van verkoper worden, voor zover de klant
              zelf kenmerken zoals huisnummer, tekst, maatvoering,
              kleurstelling, vorm of andere persoonlijke specificaties
              kiest, volgens specificaties van de klant vervaardigd en/of
              duidelijk gepersonaliseerd.
            </li>
            <li>
              Voor dergelijke producten geldt de wettelijke uitzondering op
              het herroepingsrecht voor producten die volgens specificaties
              van de consument zijn vervaardigd of duidelijk voor een
              specifieke persoon bestemd zijn.
            </li>
            <li>
              Dit betekent dat de consument voor een dergelijk
              maatwerkproduct geen wettelijke bedenktijd van 14 dagen heeft
              en de bestelling na het sluiten van de overeenkomst niet
              uitsluitend wegens spijt kan retourneren of herroepen.
            </li>
            <li>
              De klant wordt v&oacute;&oacute;r het definitief plaatsen van
              de bestelling duidelijk ge&iuml;nformeerd dat voor het
              betreffende gepersonaliseerde maatwerkproduct geen
              herroepingsrecht bestaat.
            </li>
            <li>
              Het ontbreken van een herroepingsrecht wegens maatwerk doet
              geen afbreuk aan de wettelijke rechten van de consument
              wanneer het geleverde product gebrekkig is, beschadigd is,
              verkeerd is vervaardigd of anderszins niet aan de
              overeenkomst beantwoordt.
            </li>
            <li>
              Voor eventuele producten uit het assortiment die niet volgens
              specificaties van de klant zijn vervaardigd en niet duidelijk
              gepersonaliseerd zijn, kan het wettelijke herroepingsrecht
              wel van toepassing zijn. Voor die producten gelden de
              wettelijke regels omtrent bedenktijd en herroeping.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 9 &ndash; Wijzigen of annuleren van een
            maatwerkbestelling
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Omdat een huisnummerbordje speciaal voor de klant wordt
              vervaardigd, kan verkoper na het sluiten van de overeenkomst
              snel beginnen met de voorbereiding of productie.
            </li>
            <li>
              De klant kan verzoeken om een bestelling te wijzigen of te
              annuleren door zo spoedig mogelijk contact op te nemen met
              verkoper.
            </li>
            <li>
              Een verzoek tot wijziging of annulering geeft bij een
              maatwerkproduct waarvoor het wettelijke herroepingsrecht niet
              geldt niet automatisch recht op annulering.
            </li>
            <li>
              Indien de productie nog niet is begonnen, kan verkoper naar
              eigen inzicht akkoord gaan met een wijziging of annulering.
            </li>
            <li>
              Indien verkoper vrijwillig akkoord gaat met een wijziging die
              extra werkzaamheden of materialen vereist, worden eventuele
              aanvullende kosten vooraf aan de klant meegedeeld.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 10 &ndash; Eigenschappen van ge&euml;mailleerde
            producten
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Ge&euml;mailleerde huisnummerbordjes worden vervaardigd
              volgens het door verkoper beschreven productieproces.
            </li>
            <li>
              Voor zover dit inherent is aan het gebruikte materiaal en
              productieproces, kunnen beperkte verschillen voorkomen tussen
              de weergave op een beeldscherm en het uiteindelijke product,
              bijvoorbeeld ten aanzien van kleurweergave.
            </li>
            <li>
              Afbeeldingen en digitale voorbeelden op de webshop zijn
              bedoeld om een zo betrouwbaar mogelijke indruk van het
              product te geven. Beeldscherminstellingen kunnen de weergave
              van kleuren be&iuml;nvloeden.
            </li>
            <li>
              Een afwijking kan niet uitsluitend op grond van dit artikel
              worden aangemerkt als toegestaan wanneer het product daardoor
              niet de eigenschappen bezit die de consument op grond van de
              overeenkomst redelijkerwijs mocht verwachten.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 11 &ndash; Wettelijke garantie en conformiteit
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>De consument heeft altijd recht op een product dat aan de overeenkomst voldoet.</li>
            <li>
              Het geleverde huisnummerbordje moet de eigenschappen bezitten
              die de consument op grond van de overeenkomst redelijkerwijs
              mag verwachten.
            </li>
            <li>
              Wanneer een product niet aan de overeenkomst voldoet, heeft
              de consument de rechten die voortvloeien uit de wettelijke
              garantieregels. Deze wettelijke rechten kunnen door deze
              leveringsvoorwaarden niet worden beperkt.
            </li>
            <li>
              Afhankelijk van de omstandigheden kan de consument onder meer
              recht hebben op kosteloos herstel of vervanging en, wanneer
              aan de wettelijke voorwaarden daarvoor is voldaan,
              prijsvermindering of ontbinding van de overeenkomst.
            </li>
            <li>
              Kosten die noodzakelijk zijn om een gerechtvaardigd beroep op
              de wettelijke garantie af te handelen, worden niet aan de
              consument doorberekend voor zover de wet bepaalt dat deze
              kosten voor rekening van verkoper komen.
            </li>
            <li>
              Eventuele aanvullende commerci&euml;le garantie van verkoper
              doet geen afbreuk aan de wettelijke garantierechten van de
              consument.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 12 &ndash; Fout van de klant
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Wanneer het product exact overeenkomstig de door de klant
              opgegeven of uitdrukkelijk goedgekeurde specificaties is
              vervaardigd, maar deze specificaties een fout bevatten, zoals
              een verkeerd huisnummer of verkeerd gespelde tekst, is
              verkoper in beginsel niet verantwoordelijk voor die fout.
            </li>
            <li>
              Verkoper zal in een dergelijke situatie waar mogelijk met de
              klant overleggen over een oplossing. Verkoper mag voor het
              opnieuw vervaardigen van het product redelijke kosten in
              rekening brengen.
            </li>
            <li>Dit artikel geldt niet wanneer de fout aan verkoper is toe te rekenen.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 13 &ndash; Fout van verkoper
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Wanneer het geleverde product door een aan verkoper toe te
              rekenen fout afwijkt van de overeengekomen specificaties, kan
              de klant dit bij verkoper melden.
            </li>
            <li>
              Indien de klacht gegrond is, zal verkoper overeenkomstig de
              wettelijke garantieregels een passende oplossing bieden,
              bijvoorbeeld kosteloos herstel of vervanging.
            </li>
            <li>
              Verkoper mag de klant vragen foto&rsquo;s of andere
              informatie te verstrekken voor zover dit redelijkerwijs
              noodzakelijk is om de klacht te beoordelen.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 14 &ndash; Klachten
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Klachten over een bestelling kunnen worden gemeld via:
              <span className="mt-2 block space-y-0.5">
                <span className="block">
                  E-mail:{" "}
                  <a
                    href={`mailto:${companyInfo.email}`}
                    className="underline decoration-border underline-offset-2 hover:text-primary"
                  >
                    {companyInfo.email}
                  </a>
                </span>
                <span className="block">
                  Postadres: {companyInfo.street}, {companyInfo.postalCode}{" "}
                  {companyInfo.city}
                </span>
                <span className="block">Telefoon: {companyInfo.phone}</span>
              </span>
            </li>
            <li>
              Verkoper behandelt klachten binnen een redelijke termijn en
              informeert de klant over de verdere afhandeling.
            </li>
            <li>Het indienen van een klacht beperkt de wettelijke rechten van de consument niet.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 15 &ndash; Overmacht
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Indien verkoper door een omstandigheid die redelijkerwijs
              niet voor zijn rekening komt tijdelijk niet kan leveren,
              informeert verkoper de klant daar zo spoedig mogelijk over.
            </li>
            <li>
              Partijen treden in dat geval zo nodig in overleg over een
              redelijke oplossing.
            </li>
            <li>
              Dit artikel beperkt geen dwingendrechtelijke rechten die een
              consument bij niet-tijdige of niet-uitgevoerde levering
              heeft.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 16 &ndash; Persoonsgegevens
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Voor de verwerking van persoonsgegevens in verband met
            bestellingen, betalingen, verzending en klantenservice geldt
            de{" "}
            <Link
              href="/privacyverklaring"
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              privacyverklaring
            </Link>{" "}
            van verkoper.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 17 &ndash; Toepasselijk recht
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>Op overeenkomsten met verkoper is Nederlands recht van toepassing.</li>
            <li>
              Deze rechtskeuze ontneemt een consument die in een andere
              lidstaat van de Europese Unie woont niet de bescherming van
              dwingende bepalingen van het recht waarop die consument
              zonder deze rechtskeuze aanspraak zou kunnen maken.
            </li>
            <li>Geschillen kunnen worden voorgelegd aan de volgens de wet bevoegde rechter.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Artikel 18 &ndash; Slotbepalingen
          </h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            <li>
              Indien een bepaling uit deze voorwaarden nietig,
              vernietigbaar of anderszins niet afdwingbaar blijkt te zijn,
              blijven de overige bepalingen zoveel mogelijk van kracht.
            </li>
            <li>
              Verkoper mag deze voorwaarden voor toekomstige bestellingen
              wijzigen. Op een reeds gesloten overeenkomst blijven in
              beginsel de voorwaarden van toepassing waarmee de klant bij
              het sluiten van die overeenkomst heeft ingestemd.
            </li>
            <li>De meest actuele versie van deze voorwaarden wordt via de webshop beschikbaar gesteld.</li>
          </ol>
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
