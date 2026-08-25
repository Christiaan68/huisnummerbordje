import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { SizeSelector } from "@/components/configurator/SizeSelector";

export default function MaatPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 4 van 7
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Maat</h1>
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
