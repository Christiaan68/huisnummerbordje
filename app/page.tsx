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
              hieronder) met een donkere overlay voor leesbaarheid. Zonder
              afbeelding valt de sectie terug op het donkere basisfond. */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${hero.backgroundImage})` }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-32 sm:pt-40 lg:grid-cols-2 lg:pb-28">
            <div>
              <h1 className="font-serif text-4xl font-medium leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                {hero.intro}
              </p>
              <Link
                href={hero.ctaHref}
                className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {hero.ctaLabel}
              </Link>
            </div>

            <EnamelPlateSignature />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
