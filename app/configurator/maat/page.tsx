import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { SizeSelector } from "@/components/configurator/SizeSelector";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function MaatPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 4 van 7" title="Maat" />
     <p className="mt-4 text-muted-foreground">
        Kies de maat van jouw huisnummerbordje.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Maten zijn weergegeven als hoogte × breedte. 
      </p>

      <div className="mt-8">
        <SizeSelector />
      </div>

      <ConfiguratorNav stepId="maat" />
    </div>
  );
}
