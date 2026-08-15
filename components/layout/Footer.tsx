import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Emaille Huisnummers. Gemaakt om
          jarenlang mee te gaan.
        </p>
        <Link
          href="/bedrijfsgegevens"
          className="inline-flex items-center underline-offset-4 hover:text-foreground hover:underline"
        >
          Bedrijfsgegevens
        </Link>
      </div>
    </footer>
  );
}
