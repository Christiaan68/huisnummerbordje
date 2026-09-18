import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteContent, companyInfo } from "@/config/site-content";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import { getFaqItems } from "@/lib/faq/fetchFaq";
import { resolveFaqTokens } from "@/lib/faq/resolveTokens";
import { FAQ_CATEGORIES } from "@/lib/faq/categories";
import { getNotificationEmail } from "@/lib/email/settings";

export const metadata: Metadata = {
  title: "Veelgestelde vragen | Emaille Huisnummers",
  description:
    "Antwoorden op veelgestelde vragen over het kiezen, personaliseren en bestellen van een emaille huisnummerbordje.",
};

// Geen statische caching van deze pagina: de antwoorden (en vooral de
// prijsvoorbeelden erin) moeten altijd de actuele beheertool-gegevens tonen,
// net als de configurator zelf.
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  // 3 onafhankelijke aanroepen, parallel — dezelfde live prijsgegevens (met
  // dezelfde automatische terugval-op-reservekopie) als de configurator
  // gebruikt, zodat een bedrag in de FAQ nooit kan afwijken van wat de klant
  // in de configurator ziet. contactEmail (toegevoegd 18-9-2026) is voor het
  // "{{contact-email}}"-token in een FAQ-antwoord — zelfde adres en zelfde
  // terugvalgedrag als de vraag-pop-up in de configurator zelf gebruikt.
  const [pricingData, faqData, contactEmail] = await Promise.all([
    getLivePricingData(),
    getFaqItems(),
    getNotificationEmail("question_notification", companyInfo.email),
  ]);

  const itemsByCategory = new Map<string, typeof faqData.items>();
  faqData.items.forEach((item) => {
    const list = itemsByCategory.get(item.category) ?? [];
    list.push(item);
    itemsByCategory.set(item.category, list);
  });
  itemsByCategory.forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder));

  const heeftVragen = faqData.beschikbaar && faqData.items.length > 0;

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

      <main className="relative mx-auto max-w-3xl px-6 pb-20 pt-32 sm:pt-40">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Veelgestelde vragen
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Alles over het kiezen, personaliseren en bestellen van een emaille
          huisnummerbordje — en meer over ons product, het handwerk erachter
          en onze service.
        </p>

        {!heeftVragen && (
          <p className="mt-10 rounded-sm border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            De veelgestelde vragen zijn op dit moment tijdelijk niet
            beschikbaar. Neem gerust rechtstreeks{" "}
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-foreground"
            >
              contact
            </Link>{" "}
            met ons op.
          </p>
        )}

        {heeftVragen && (
          <div className="mt-10 space-y-10">
            {FAQ_CATEGORIES.map((category) => {
              const items = itemsByCategory.get(category.id);
              if (!items || items.length === 0) return null;
              return (
                <section key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`}>
                  <h2
                    id={`${category.id}-heading`}
                    className="font-serif text-xl text-foreground"
                  >
                    {category.label}
                  </h2>
                  <div className="mt-4 divide-y divide-border/60 border-t border-border/60">
                    {items.map((item) => (
                      <details key={item.id} className="group py-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                          <span>{item.question}</span>
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {resolveFaqTokens(item.answer, pricingData, contactEmail)}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-14 text-sm text-muted-foreground">
          Staat je vraag er niet bij? Neem gerust{" "}
          <Link
            href="/contact"
            className="underline underline-offset-4 hover:text-foreground"
          >
            contact
          </Link>{" "}
          met ons op.
        </p>
      </main>

      <Footer />
    </div>
  );
}
