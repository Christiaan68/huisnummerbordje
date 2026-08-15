import Link from "next/link";
import { Menu as MenuIcon } from "lucide-react";

export function Header({
  showConfiguratorLink = true,
}: {
  // Op de contactpagina staat deze link uit — Christiaan gaf aan dat een
  // "Start configurator"-link daar verwarrend is.
  showConfiguratorLink?: boolean;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          {/* Hamburgermenu (native <details>/<summary>, geen extra
              JavaScript nodig). Nu "Home" en "Contact" erin — later
              eenvoudig uit te breiden met extra onderwerpen. */}
          <details className="group relative">
            <summary
              aria-label="Menu"
              className="flex cursor-pointer list-none items-center justify-center rounded-sm p-1.5 text-foreground hover:bg-secondary [&::-webkit-details-marker]:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </summary>
            <div className="absolute left-0 top-full mt-2 min-w-[10rem] rounded-sm border border-border bg-card py-1 shadow-lg">
              <Link
                href="/"
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Home
              </Link>
              <Link
                href="/configurator"
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Start configurator
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Contact
              </Link>
            </div>
          </details>

          <Link
            href="/"
            className="font-serif text-lg tracking-wide text-foreground"
          >
            Emaille Huisnummers
          </Link>
        </div>

        {showConfiguratorLink && (
          <Link
            href="/configurator"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Start configurator
          </Link>
        )}
      </div>
    </header>
  );
}
