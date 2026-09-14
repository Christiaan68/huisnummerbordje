import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EnamelPlateSignature } from "@/components/home/EnamelPlateSignature";
import { siteContent } from "@/config/site-content";

export default function HomePage() {
  const { hero } = siteContent;

  return (
    <>
      <Header />

      <main>
        <section className="relative overflow-hidden">
          {/* Achtergrondfoto (door de eigenaar aan te leveren op het pad
              hieronder) met een lichte, warmgetinte overlay: de foto blijft
              goed zichtbaar en in kleur, leesbaarheid van de tekst komt nu
              van text-shadow i.p.v. een donkere wasteil eroverheen. Zonder
              afbeelding valt de sectie terug op het donkere basisfond. */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${hero.backgroundImage})` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(20,16,12,0.28), rgba(20,16,12,0.14) 45%, rgba(20,16,12,0.48))",
            }}
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-32 sm:pt-40 lg:grid-cols-2 lg:pb-28">
            <div>
              <h1
                className="font-serif text-4xl font-medium leading-[1.1] text-foreground sm:text-5xl lg:text-6xl [text-shadow:0_3px_14px_rgba(0,0,0,0.75),0_1px_3px_rgba(0,0,0,0.6)]"
              >
                {hero.title}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#e7e2d6] sm:text-lg [text-shadow:0_2px_10px_rgba(0,0,0,0.8),0_1px_2px_rgba(0,0,0,0.7)]">
                {hero.intro}
              </p>
              <Link
                href={hero.ctaHref}
                className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {hero.ctaLabel}
              </Link>
            </div>

            {/* Op mobiel (kleiner dan het "sm"-breakpoint, ca. 640px) tonen
                we deze foto niet — Christiaan gaf aan dat de
                homepage-plate.jpg op mobiel niet gebruikt moet worden. */}
            <div className="hidden sm:block">
              <EnamelPlateSignature />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
