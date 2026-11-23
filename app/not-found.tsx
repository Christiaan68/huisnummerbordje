import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteContent } from "@/config/site-content";

/**
 * C3 (testrapport 22-11-2026): Nederlandse pagina voor een adres dat niet
 * bestaat (404), in dezelfde opmaak als de bedankpagina.
 */
export default function NotFound() {
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

      <Header />

      <main className="relative mx-auto max-w-2xl px-6 pb-20 pt-32 sm:pt-40">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Pagina niet gevonden
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Deze pagina bestaat niet (meer). Misschien is het adres verkeerd
          getypt of is de pagina verplaatst.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar home
          </Link>
          <Link
            href="/configurator/vorm"
            className="inline-flex items-center justify-center rounded-sm border border-border bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
          >
            Ontwerp jouw Huisnummerbord
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
