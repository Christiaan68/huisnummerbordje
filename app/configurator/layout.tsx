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

            {/* Zelfde achtergrondfoto als de homepage-hero, met dezelfde
                lichte warmgetinte overlay (i.p.v. de donkere teal-wasteil)
                zodat de foto goed zichtbaar en in kleur blijft. Anders dan
                eerst gedacht staat hier wél veel tekst los over de foto (de
                stap-bolletjes, de stap-titel per stap, en de "live
                preview"-kolom incl. specificatielijst/totaalprijs zijn
                bewust GEEN kaart, zie ProductPreview.tsx) — 14-9-2026,
                gemeld door Christiaan na screenshot: die tekst was bijna
                onleesbaar. Los van een iets donkerdere overlay lossen we dat
                nu op met text-shadow, i.p.v. een kader/vlak achter de tekst
                te zetten (dat wilde Christiaan expliciet niet). text-shadow
                is een "inherited" CSS-eigenschap, dus 1 shadow hieronder op
                de buitenste inhoud-wrapper werkt door tot alle tekst erin —
                ook de tekst die al wél op een kaart staat (bv. de
                vorm-keuzekaarten), daar valt de schaduw gewoon niet op. */}
            <div
              className="fixed inset-0 -z-10 bg-cover bg-center"
              style={{ backgroundImage: `url(${siteContent.hero.backgroundImage})` }}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 -z-10"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(20,16,12,0.55), rgba(20,16,12,0.4) 45%, rgba(20,16,12,0.78))",
              }}
              aria-hidden="true"
            />

            {/* 14-9-2026: op de "controle"-stap (hele specificatielijst los
                over de foto, in het drukste deel van de foto) bleek dit nog
                steeds te weinig leesbaar — overlay hierboven en de
                text-shadow hieronder allebei nog wat verder aangezet. */}
            <div
              className="relative mx-auto max-w-6xl px-6 pb-10 pt-28 sm:pt-32"
              style={{
                textShadow:
                  "0 2px 10px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.65)",
              }}
            >
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
