import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactQuestionForm } from "@/components/contact/ContactQuestionForm";
import { siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Stel een vraag | Emaille Huisnummers",
  description: "Stel je vraag over onze geëmailleerde huisnummerbordjes.",
};

export default function ContactVraagPage() {
  return (
    <div className="relative min-h-screen">
      {/* Zelfde achtergrondfoto + overlay als op de Contact-pagina, zodat dit
          er visueel bij aansluit. */}
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
          Stel een vraag
        </h1>

        <ContactQuestionForm />
      </main>

      <Footer />
    </div>
  );
}
