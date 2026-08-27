import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; Emaille Huisnummers is een onderdeel van{" "}
          <a
            href="https://www.langcat.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Langcat Emaille
          </a>
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
        </div>
      </div>
    </footer>
  );
}
