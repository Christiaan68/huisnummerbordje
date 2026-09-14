import { ConfiguratorProvider } from "@/lib/configuration/ConfiguratorContext";
import { FontPreviewProvider } from "@/lib/configuration/FontPreviewContext";
import { PricingDataProvider } from "@/lib/configuration/PricingDataContext";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import { ProgressIndicator } from "@/components/configurator/ProgressIndicator";
import { ProductPreview } from "@/components/configurator/ProductPreview";
import { Header } from "@/components/layout/Header";
import { siteContent } from "@/config/site-content";

export default async function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Haalt bij elk bezoek aan de configurator de actuele prijzen op bij de
  // online prijsbeheeromgeving (met automatische terugval op de vaste
  // reservekopie als dat niet lukt) — zie lib/configuration/livePricing.ts.
  const pricingData = await getLivePricingData();

  return (
    <ConfiguratorProvider>
      <PricingDataProvider data={pricingData}>
        <FontPreviewProvider>
          <div className="relative min-h-screen">
            {/* Zelfde hamburgermenu (Home / Start configurator / Contact) als
                op de andere pagina's, nu ook boven elke configuratorstap. De
                "Start configurator"-link rechtsboven blijft hier verborgen,
                want je zit al in de configurator. */}
            <Header showConfiguratorLink={false} />

            {/* Zelfde achtergrondfoto als de homepage-hero, nu met dezelfde
                lichte warmgetinte overlay (i.p.v. de donkere teal-wasteil)
                zodat de foto ook hier goed zichtbaar en in kleur blijft. Hier
                staat geen tekst los over de foto (de formulierstappen en
                preview hebben hun eigen kaart-achtergrond), dus geen
                text-shadow nodig — de overlay mag hier wel iets sterker zijn
                dan op de homepage, voor rustige contrast met die kaarten. */}
            <div
              className="fixed inset-0 -z-10 bg-cover bg-center"
              style={{ backgroundImage: `url(${siteContent.hero.backgroundImage})` }}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 -z-10"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(20,16,12,0.35), rgba(20,16,12,0.2) 45%, rgba(20,16,12,0.6))",
              }}
              aria-hidden="true"
            />

            <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-28 sm:pt-32">
              <ProgressIndicator />
              <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_260px]">
                <div>{children}</div>
                <ProductPreview />
              </div>
            </div>
          </div>
        </FontPreviewProvider>
      </PricingDataProvider>
    </ConfiguratorProvider>
  );
}
