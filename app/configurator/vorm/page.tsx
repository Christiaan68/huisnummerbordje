import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { ShapeSelector } from "@/components/configurator/ShapeSelector";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function VormPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 1 van 7" title="Vorm" />
      <p className="mt-4 text-muted-foreground">
        Kies de vorm van jouw huisnummerbordje.
      </p>

      <div className="mt-8">
        <ShapeSelector />
      </div>

      <ConfiguratorNav stepId="vorm" />
    </div>
  );
}
