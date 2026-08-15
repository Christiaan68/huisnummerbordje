import Link from "next/link";
import { ChevronDown } from "lucide-react";

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

        <div className="flex items-center gap-6">
          {/* Uitklapmenu (native <details>/<summary>, geen extra JavaScript
              nodig). Nu alleen "Contact" erin — later eenvoudig uit te
              breiden met extra regels. */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              Menu
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full mt-2 min-w-[10rem] rounded-sm border border-border bg-card py-1 shadow-lg">
              <Link
                href="/contact"
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Contact
              </Link>
            </div>
          </details>

          <Link
            href="/configurator"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Start configurator
          </Link>
        </div>
      </div>
    </header>
  );
}
