import { ConfiguratorProvider } from "@/lib/configuration/ConfiguratorContext";
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
        <div className="relative min-h-screen">
          {/* Zelfde hamburgermenu (Home / Start configurator / Contact) als
              op de andere pagina's, nu ook boven elke configuratorstap. De
              "Start configurator"-link rechtsboven blijft hier verborgen,
              want je zit al in de configurator. */}
          <Header showConfiguratorLink={false} />

          {/* Zelfde achtergrondfoto + overlay als de homepage-hero, zodat de
              configurator er visueel bij aansluit i.p.v. een effen donker vlak. */}
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${siteContent.hero.backgroundImage})` }}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/85 to-background"
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
      </PricingDataProvider>
    </ConfiguratorProvider>
  );
}
