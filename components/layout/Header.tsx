"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Menu as MenuIcon } from "lucide-react";

export function Header({
  showConfiguratorLink = true,
}: {
  // Op de contactpagina staat deze link uit — Christiaan gaf aan dat een
  // "Start configurator"-link daar verwarrend is.
  showConfiguratorLink?: boolean;
}) {
  // Wijst naar het <details>-element van het hamburgermenu, zodat we het
  // programmatisch kunnen sluiten (zie closeMenu hieronder).
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Sluit het menu bij het klikken op een link erin. Nodig omdat een klik
  // op bv. "Home" terwijl je al op de homepage staat geen paginawissel
  // veroorzaakt — zonder deze functie bleef het menu dan open staan en
  // leek de pagina "vast te lopen".
  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  // Sluit het menu ook als je ergens anders op de pagina klikt (niet op het
  // menu zelf). Een native <details>-element doet dat standaard niet — die
  // blijft openstaan tot je nogmaals op het hamburgericoon klikt of op een
  // link erin (gemeld door Christiaan, 19-8-2026).
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const menu = menuRef.current;
      if (menu && menu.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          {/* Hamburgermenu (native <details>/<summary>). We sluiten het
              zelf via closeMenu() zodra een link erin wordt aangeklikt. */}
          <details ref={menuRef} className="group relative">
            <summary
              aria-label="Menu"
              className="flex cursor-pointer list-none items-center justify-center rounded-sm p-1.5 text-foreground hover:bg-secondary [&::-webkit-details-marker]:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </summary>
            <div className="absolute left-0 top-full mt-2 min-w-[10rem] rounded-sm border border-border bg-card py-1 shadow-lg">
              <Link
                href="/"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Home
              </Link>
              <Link
                href="/configurator"
                onClick={closeMenu}
                className="block px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                Start configurator
              </Link>
              {/* "Leveringsvoorwaarden" en "Retourneren" zijn op verzoek van
                  Christiaan (25-8-2026) uit dit hamburgermenu gehaald — deze
                  pagina's blijven wel gewoon bereikbaar via de links
                  onderaan iedere pagina, zie components/layout/Footer.tsx. */}
              <Link
                href="/contact"
                onClick={closeMenu}
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
