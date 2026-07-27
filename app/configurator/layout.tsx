import { ConfiguratorProvider } from "@/lib/configuration/ConfiguratorContext";
import { ProgressIndicator } from "@/components/configurator/ProgressIndicator";
import { ProductPreview } from "@/components/configurator/ProductPreview";

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfiguratorProvider>
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
        <ProgressIndicator />
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_260px]">
          <div>{children}</div>
          <ProductPreview />
        </div>
      </div>
    </ConfiguratorProvider>
  );
}
