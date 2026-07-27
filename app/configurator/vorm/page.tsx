import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { ShapeSelector } from "@/components/configurator/ShapeSelector";
import { FinishSelector } from "@/components/configurator/FinishSelector";

export default function VormPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 1 van 6
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Vorm</h1>
      <p className="mt-4 text-muted-foreground">
        Kies de vorm van jouw huisnummerbordje.
      </p>

      <div className="mt-8">
        <ShapeSelector />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Afwerking
        </h2>
        <FinishSelector />
      </div>

      <ConfiguratorNav stepId="vorm" />
    </div>
  );
}
