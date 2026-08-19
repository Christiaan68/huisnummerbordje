import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Leveringsvoorwaarden | Emaille Huisnummers",
  description: "Leveringsvoorwaarden van Emaille Huisnummers.",
};

// Nog een lege pagina — alleen de titel staat er, de daadwerkelijke tekst
// volgt later (gevraagd door Christiaan, 19-8-2026). Zelfde opzet
// (achtergrond/Header/Footer) als de andere pagina's van de webshop, zie
// app/contact/page.tsx.
export default function LeveringsvoorwaardenPage() {
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

      <Header showConfiguratorLink={false} />

      <main className="relative mx-auto max-w-2xl px-6 pb-20 pt-32 sm:pt-40">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Leveringsvoorwaarden
        </h1>
      </main>

      <Footer />
    </div>
  );
}
