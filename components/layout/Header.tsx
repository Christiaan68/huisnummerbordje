import Link from "next/link";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-serif text-lg tracking-wide text-foreground"
        >
          Emaille Huisnummers
        </Link>
        <Link
          href="/configurator"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Start configurator
        </Link>
      </div>
    </header>
  );
}
