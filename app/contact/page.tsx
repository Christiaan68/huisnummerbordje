import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { companyInfo } from "@/config/site-content";

export const metadata: Metadata = {
  title: "Contact | Emaille Huisnummers",
  description: "Bedrijfsgegevens en contactgegevens van Emaille Huisnummers.",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-6 pb-20 pt-32 sm:pt-40">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Over ons
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
          Contact
        </h1>

        {/* Logo van Langcat, de fabrikant/het bedrijf achter Emaille
            Huisnummers — linkt door naar hun eigen website. */}
        <a
          href="https://www.langcat.nl/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/langcat-logo.jpg"
            alt="Langcat Emaille"
            className="h-auto w-40 rounded-sm"
          />
        </a>

        <dl className="mt-8">
          <Row label="Bedrijfsnaam" value={companyInfo.name} />
          <Row
            label="Adres"
            value={`${companyInfo.street}, ${companyInfo.postalCode} ${companyInfo.city}`}
          />
          <Row label="Land" value={companyInfo.country} />
          <Row label="Telefoon" value={companyInfo.phone} />
          <Row label="E-mail" value={companyInfo.email} />
          <Row label="KVK-nummer" value={companyInfo.kvkNumber} />
          <Row label="Btw-nummer" value={companyInfo.vatNumber} />
        </dl>
      </main>

      <Footer />
    </>
  );
}
