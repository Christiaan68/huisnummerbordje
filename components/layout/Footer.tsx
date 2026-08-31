import Link from "next/link";
import { LangcatTransitionLink } from "@/components/layout/LangcatTransitionLink";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { PaymentMethodIcons } from "@/components/layout/PaymentMethodIcons";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; Emaille Huisnummers is een onderdeel van{" "}
          {/* Gebruikt LangcatTransitionLink (27-8-2026) voor een zachte
              overgang vóórdat het nieuwe tabblad opent — zie de
              toelichting in dat bestand voor hoe dit simpel terug te
              draaien is. */}
          <LangcatTransitionLink className="underline underline-offset-4 hover:text-foreground">
            Langcat Emaille
          </LangcatTransitionLink>
          .
        </p>

        {/* Leveringsvoorwaarden (25-8-2026) en Retourbeleid (25-8-2026,
            linktekst op 27-8-2026 gewijzigd van "Retourneren" naar
            "Retourbeleid") — beide met volledige tekst, aangeleverd door
            Christiaan. De pagina/route heet nog "retourneren-reclameren"
            (ongewijzigd gelaten om de URL niet te breken), alleen de
            zichtbare linktekst is aangepast. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/leveringsvoorwaarden"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Leveringsvoorwaarden
          </Link>
          <Link
            href="/retourneren-reclameren"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Retourbeleid
          </Link>
          {/* Privacyverklaring, Cookiebeleid en het heropenen van het
              cookie-voorkeurenscherm, toegevoegd 27-8-2026 in het kader
              van de AVG/cookie-aanpassing (zie
              claude/project-tijdlijn.md). */}
          <Link
            href="/privacyverklaring"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Privacyverklaring
          </Link>
          <Link
            href="/cookiebeleid"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Cookiebeleid
          </Link>
          <CookieSettingsButton className="underline underline-offset-4 hover:text-foreground" />
        </div>
      </div>

      {/* Betaalmethodes (31-8-2026, op verzoek van Christiaan) — algemene
          geruststelling op elke pagina, los van het moment vlak vóór het
          afrekenen zelf (zie ContactDetailsForm.tsx voor die 2e plek). */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 border-t border-border px-6 py-4 text-sm text-muted-foreground">
        <span>Betalen met:</span>
        <PaymentMethodIcons />
      </div>
    </footer>
  );
}
