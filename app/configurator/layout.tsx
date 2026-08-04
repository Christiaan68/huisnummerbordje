import { ConfiguratorProvider } from "@/lib/configuration/ConfiguratorContext";
import { ProgressIndicator } from "@/components/configurator/ProgressIndicator";
import { ProductPreview } from "@/components/configurator/ProductPreview";
import { siteContent } from "@/config/site-content";

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfiguratorProvider>
      <div className="relative min-h-screen">
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

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <ProgressIndicator />
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_260px]">
            <div>{children}</div>
            <ProductPreview />
          </div>
        </div>
      </div>
    </ConfiguratorProvider>
  );
}