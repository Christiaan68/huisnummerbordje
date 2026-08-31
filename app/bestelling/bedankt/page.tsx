import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PendingPaymentAutoRefresh } from "@/components/order/PendingPaymentAutoRefresh";
import { siteContent } from "@/config/site-content";
import { getOrderById } from "@/lib/mysql/client";

export const metadata: Metadata = {
  title: "Bedankt voor je bestelling | Emaille Huisnummers",
  description: "Status van je betaling.",
};

/**
 * Pagina waar Mollie de klant naar terugstuurt na het betalen (of
 * annuleren), toegevoegd 29-8-2026 — zie app/api/create-payment/route.ts
 * (bouwt deze URL, met ?order=<id>) en app/api/mollie-webhook/route.ts (de
 * ECHTE bevestiging van de betaling, die hier los van staat: Mollie stuurt
 * de klant hierheen zodra hij/zij klaar is met de betaalpagina, maar dat
 * zegt op zichzelf nog niets over of de betaling ook echt gelukt is — soms
 * komt de webhook-melding een paar seconden later binnen dan deze
 * terugkeer. Deze pagina toont daarom de status zoals die op dit moment in
 * de database staat, en ververst zichzelf automatisch een paar keer zolang
 * die nog op 'pending' staat, zodat de klant niet zelf hoeft te verversen).
 */
export default async function BestellingBedanktPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderId = searchParams.order ? Number(searchParams.order) : NaN;
  const order = Number.isNaN(orderId) ? null : await getOrderById(orderId);

  let title: string;
  let message: string;
  let showAutoRefresh = false;
  // Op verzoek van Christiaan (29-8-2026, nadat hij de "in behandeling"-
  // status testte): de knop naar de configurator hoort ALLEEN te verschijnen
  // als "opnieuw/nieuw bestellen" ook echt de juiste vervolgstap is — dus
  // NIET bij "in behandeling" (payment_status 'open'/'pending'), want daar is
  // niets misgegaan en niets om over te doen; de betaling kan alsnog gewoon
  // lukken. Voorheen stond die knop daar óók, met de tekst "Opnieuw
  // proberen" — verwarrend, want hij startte niet de betaling opnieuw maar
  // een hele nieuwe configuratie, én de opvallende oranje kleur suggereerde
  // ten onrechte dat dit dé vervolgstap was.
  let showRestartButton = false;
  let restartLabel = "";

  if (!order) {
    title = "Bestelling niet gevonden";
    message =
      "We kunnen deze bestelling niet terugvinden. Is er bij het betalen iets misgegaan? Neem gerust contact met ons op, dan zoeken we het voor je uit.";
    showRestartButton = true;
    restartLabel = "Nieuwe bestelling starten";
  } else if (order.payment_status === "paid") {
    title = "Bedankt voor je bestelling!";
    message =
      "Je betaling is gelukt. We hebben je zojuist een bevestigingsmail gestuurd met een overzicht van je configuratie.";
  } else if (
    order.payment_status === "failed" ||
    order.payment_status === "expired" ||
    order.payment_status === "canceled"
  ) {
    title = "Betaling niet gelukt";
    message =
      "De betaling is niet gelukt, verlopen of geannuleerd. Er is niets van je rekening afgeschreven. Je kunt het gerust opnieuw proberen door de configurator nog eens te doorlopen.";
    // Hier klopt "opnieuw proberen" feitelijk ook niet helemaal (er wordt
    // een nieuwe configuratie/bestelling gestart, niet dezelfde betaling
    // opnieuw geprobeerd) — daarom ook hier de duidelijkere tekst.
    showRestartButton = true;
    restartLabel = "Nieuwe bestelling starten";
  } else {
    title = "Betaling wordt verwerkt";
    // Oorspronkelijke, simpele tekst — de meeste betalingen zijn namelijk
    // gewoon binnen een paar seconden klaar, dus niet meteen bij de eerste
    // weergave al een voorzichtigere/waarschuwende tekst tonen. Duurt het
    // langer (zie hieronder, bij PendingPaymentAutoRefresh), dan verschijnt
    // er automatisch een extra regel bij — zie de toelichting daar.
    message =
      "We wachten nog even op de bevestiging van je betaling. Dit duurt normaal maar een paar seconden — deze pagina ververst zichzelf vanzelf. Je hoeft hier niets voor te doen.";
    showAutoRefresh = true;
    // Bewust GEEN knop hier — zie toelichting bij showRestartButton.
  }

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

      {/* Ververst deze pagina om de 4 seconden vanzelf, zolang de betaling
          nog niet definitief bevestigd is — via React/JavaScript
          (PendingPaymentAutoRefresh), NIET via een browser-<meta refresh>:
          die laatste bleek na wegnavigeren (bv. "Naar home") alsnog een
          ongevraagde terugkeer naar deze pagina te veroorzaken, zie de
          toelichting in dat bestand. Toont vanaf de 2e ververste weergave
          ook zelf een extra regel tekst als het langer duurt dan een paar
          seconden — zie de toelichting in PendingPaymentAutoRefresh.tsx. */}
      {showAutoRefresh && <PendingPaymentAutoRefresh orderId={orderId} />}

      <Header showConfiguratorLink={false} />

      <main className="relative mx-auto max-w-2xl px-6 pb-20 pt-32 sm:pt-40">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          {/* Zie showRestartButton hierboven: deze knop verschijnt alleen
              als "een nieuwe bestelling starten" ook echt de juiste
              vervolgstap is (bestelling niet gevonden, of betaling
              mislukt/verlopen/geannuleerd) — niet bij "in behandeling", en
              niet meer bij een gelukte betaling. */}
          {showRestartButton && (
            <Link
              href="/configurator/vorm"
              className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {restartLabel}
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-sm border border-border bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
          >
            Naar home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
