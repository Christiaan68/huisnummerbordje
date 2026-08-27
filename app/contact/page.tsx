import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { companyInfo, siteContent } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Contact | Emaille Huisnummers",
  description: "Bedrijfsgegevens en contactgegevens van Emaille Huisnummers.",
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen">
      {/* Zelfde achtergrondfoto + overlay als op de homepage en de
          configurator, zodat de contactpagina er visueel bij aansluit. */}
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
          Contact
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Emaille Huisnummers is een onderdeel van Langcat Emaille.
        </p>

        {/* Logo van Langcat, de fabrikant/het bedrijf achter Emaille
            Huisnummers — linkt door naar hun eigen website. Het logo staat
            in eigen felgele huisstijlkleuren, wat een harde overgang gaf op
            de verder donkere achtergrond van deze site — daarom nu op een
            eigen warme "plaquette" (dezelfde kleur die elders de emaille
            bordjes zelf voorstelt, zie --plate in globals.css) met dezelfde
            zachte schaduw als de bordjes-preview in de configurator
            (ProductPreview.tsx), zodat het als bewust geplaatst object
            oogt in plaats van een los blokje (aangepast 27-8-2026, n.a.v.
            Christiaans opmerking over het contrast bij deze link). */}
        <a
          href="https://www.langcat.nl/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-sm bg-plate p-4 shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/langcat-logo.jpg"
            alt="Langcat Emaille"
            className="h-auto w-40 rounded-sm"
          />
        </a>

        <div className="mt-6 space-y-1 text-left text-sm leading-relaxed text-foreground">
          <p className="font-medium">{companyInfo.name}</p>
          <p>{companyInfo.street}</p>
          <p>
            {companyInfo.postalCode} {companyInfo.city}
          </p>
          <p>{companyInfo.country}</p>
          <p className="mt-3">{companyInfo.phone}</p>
          <p>{companyInfo.email}</p>
          <p className="mt-3 text-muted-foreground">
            KVK {companyInfo.kvkNumber}
          </p>
          <p className="text-muted-foreground">BTW {companyInfo.vatNumber}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
