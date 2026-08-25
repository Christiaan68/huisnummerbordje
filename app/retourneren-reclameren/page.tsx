import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { companyInfo, siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Retourneren | Emaille Huisnummers",
  description: "Retourneren en reclameren bij Emaille Huisnummers.",
};

// Volledige tekst aangeleverd door Christiaan op 25-8-2026 — vervangt de
// eerdere lege placeholder-pagina (19-8-2026). De route/map heet nog
// "retourneren-reclameren" (bewust ongewijzigd gelaten, anders breekt de
// bestaande URL), maar de zichtbare titel is op verzoek van Christiaan
// ingekort van "Retourneren / reclameren" naar "Retourneren" — dat is ook
// aangepast in components/layout/Header.tsx en
// components/layout/Footer.tsx, waar dezelfde tekst als menu-/footerlink
// stond. Zelfde opzet (achtergrond/Header/Footer) als de andere pagina's
// van de webshop, zie app/contact/page.tsx en
// app/leveringsvoorwaarden/page.tsx (waar dezelfde companyInfo-aanpak is
// gebruikt voor de contactgegevens).
export default function RetournerenReclamerenPage() {
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
          Retourneren
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground">
          Wij maken onze ge&euml;mailleerde huisnummerbordjes speciaal voor
          jou op basis van de door jou gekozen gegevens en specificaties.
          Daarom gelden voor onze huisnummerbordjes andere retourregels dan
          voor standaardproducten.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Kan ik mijn huisnummerbordje retourneren?
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              Een huisnummerbordje dat speciaal voor jou wordt gemaakt,
              bijvoorbeeld met een door jou gekozen huisnummer, tekst,
              kleur, formaat of andere persoonlijke specificaties, is een
              gepersonaliseerd maatwerkproduct.
            </p>
            <p>
              Voor dergelijke producten geldt de wettelijke bedenktijd van
              14 dagen niet. Je kunt een op maat gemaakt huisnummerbordje
              daarom niet retourneren of ruilen omdat je bijvoorbeeld van
              gedachten bent veranderd.
            </p>
            <p>
              Controleer daarom v&oacute;&oacute;r het plaatsen van je
              bestelling altijd zorgvuldig:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>het huisnummer en eventuele toevoeging;</li>
              <li>eventuele tekst en spelling;</li>
              <li>kleur en uitvoering;</li>
              <li>formaat en vorm;</li>
              <li>eventuele andere gekozen opties.</li>
            </ul>
            <p>
              Heb je direct na het bestellen ontdekt dat je een fout hebt
              gemaakt? Neem dan zo snel mogelijk contact met ons op. Als we
              nog niet met de voorbereiding of productie zijn begonnen,
              kijken we graag of we de bestelling nog kunnen aanpassen. We
              kunnen echter niet garanderen dat dit nog mogelijk is.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Is er iets mis met je bestelling?
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>Maatwerk betekent natuurlijk niet dat je geen garantie hebt.</p>
            <p>
              Je mag verwachten dat het huisnummerbordje dat je ontvangt
              overeenkomt met wat je hebt besteld en de eigenschappen heeft
              die je daarvan redelijkerwijs mag verwachten.
            </p>
            <p>Neem daarom contact met ons op wanneer bijvoorbeeld:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                wij een ander huisnummer of andere tekst hebben aangebracht
                dan je hebt besteld;
              </li>
              <li>je een andere uitvoering hebt ontvangen dan overeengekomen;</li>
              <li>het bordje beschadigd bij je aankomt;</li>
              <li>er sprake is van een fabricagefout;</li>
              <li>het product om een andere reden niet aan de overeenkomst voldoet.</li>
            </ul>
            <p>
              Als je klacht gegrond is, zorgen wij overeenkomstig de
              wettelijke garantieregels voor een passende oplossing.
              Afhankelijk van de situatie kan dat bijvoorbeeld kosteloos
              herstel of vervanging zijn.
            </p>
            <p>
              Je wettelijke garantierechten blijven volledig van
              toepassing, ook al betreft het een gepersonaliseerd product.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Zelf een verkeerd huisnummer of verkeerde tekst opgegeven?
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              We maken het bordje aan de hand van de gegevens die je bij je
              bestelling aan ons doorgeeft.
            </p>
            <p>
              Heb je bijvoorbeeld per ongeluk huisnummer 18 ingevuld terwijl
              dit 18A had moeten zijn, en hebben wij het bordje correct
              volgens jouw bestelling gemaakt? Dan is er geen sprake van een
              fout in het geleverde product.
            </p>
            <p>
              Neem in dat geval toch even contact met ons op. We kijken
              graag wat we voor je kunnen betekenen. Als er een nieuw
              bordje moet worden gemaakt, kunnen daarvoor kosten in
              rekening worden gebracht.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Kleur en het emailleerproces
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              Onze huisnummerbordjes worden ge&euml;mailleerd. Houd er
              rekening mee dat de kleur die je op een beeldscherm ziet
              enigszins kan afwijken van de kleur van het uiteindelijke
              product. De kleurweergave is onder andere afhankelijk van het
              gebruikte beeldscherm en de instellingen daarvan.
            </p>
            <p>
              Eventuele eigenschappen die inherent zijn aan het gebruikte
              materiaal of het emailleerproces betekenen niet automatisch
              dat een product gebrekkig is. Uiteraard moet het geleverde
              product wel voldoen aan wat je op grond van je bestelling en
              onze productinformatie redelijkerwijs mocht verwachten.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Schade tijdens het vervoer
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              Is het huisnummerbordje beschadigd bij je aangekomen? Neem
              dan bij voorkeur zo snel mogelijk contact met ons op.
            </p>
            <p>Stuur indien mogelijk mee:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>je naam en ordernummer;</li>
              <li>een korte omschrijving van de schade;</li>
              <li>een duidelijke foto van het huisnummerbordje;</li>
              <li>een foto van de verpakking als deze beschadigd is.</li>
            </ul>
            <p>
              Met deze informatie kunnen we je melding sneller beoordelen
              en oplossen.
            </p>
            <p>
              Het niet direct melden van transportschade betekent niet dat
              je automatisch je wettelijke rechten verliest.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Hoe dien ik een reclamatie in?
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>Stuur je reclamatie naar:</p>
            <div className="space-y-0.5">
              <p>Huisnummerbordjes, onderdeel van Langcat Emaille</p>
              <p>{companyInfo.street}</p>
              <p>
                {companyInfo.postalCode} {companyInfo.city}
              </p>
              <p className="mt-2">
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
            <p>
              Vermeld bij voorkeur je ordernummer en beschrijf wat er aan de
              hand is. Foto&rsquo;s van het product helpen ons om je
              melding snel te beoordelen.
            </p>
            <p>
              Wij bekijken je reclamatie zo spoedig mogelijk en nemen
              contact met je op over de verdere afhandeling.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Niet-gepersonaliseerde producten
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              Verkopen wij naast onze op maat gemaakte huisnummerbordjes
              ook producten die niet volgens jouw specificaties zijn
              gemaakt en niet gepersonaliseerd zijn? Dan kan voor die
              producten wel het wettelijke herroepingsrecht gelden.
            </p>
            <p>
              Als het wettelijke herroepingsrecht van toepassing is, heb je
              als consument in beginsel 14 dagen na ontvangst de tijd om de
              overeenkomst te herroepen. Na herroeping gelden vervolgens de
              wettelijke regels voor het terugsturen en terugbetalen van de
              bestelling.
            </p>
            <p>
              De toepasselijke retourinformatie wordt bij dergelijke
              producten en tijdens het bestelproces vermeld.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-foreground sm:text-2xl">
            Vragen?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            Twijfel je of je een product kunt retourneren of wil je een
            probleem met je huisnummerbordje melden? Neem gerust contact
            met ons op via{" "}
            <a
              href={`mailto:${companyInfo.email}`}
              className="underline decoration-border underline-offset-2 hover:text-primary"
            >
              {companyInfo.email}
            </a>
            . We kijken graag met je naar een passende oplossing.
          </p>
        </section>

        <p className="mt-12 border-t border-border/60 pt-6 text-sm leading-relaxed text-muted-foreground">
          Deze pagina vormt een praktische toelichting op onze
          leveringsvoorwaarden. Bij verschillen tussen deze toelichting en
          dwingendrechtelijke consumentenwetgeving gaan de wettelijke
          rechten van de consument altijd voor.
        </p>
      </main>

      <Footer />
    </div>
  );
}
