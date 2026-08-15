import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Emaille Huisnummers. Gemaakt om
          jarenlang mee te gaan.
        </p>
        <Link
          href="/bedrijfsgegevens"
          className="inline-flex items-center justify-center rounded-sm border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
        >
          Bedrijfsgegevens
        </Link>
      </div>
    </footer>
  );
}
