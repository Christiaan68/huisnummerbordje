"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * "Terug naar boven"-knop, toegevoegd 27-8-2026 op verzoek van Christiaan,
 * voor de lange tekstpagina's (leveringsvoorwaarden, retourbeleid,
 * privacyverklaring, cookiebeleid). Blijft vast in beeld en gaat mee tijdens
 * het scrollen, en wordt pas zichtbaar zodra er echt gescrold is — zodat hij
 * niet meteen bovenaan de pagina al in de weg staat.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Terug naar boven van de pagina"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-opacity duration-300 hover:bg-secondary ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
