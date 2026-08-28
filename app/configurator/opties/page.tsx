import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { OptionsSelector } from "@/components/configurator/OptionsSelector";

export default function OptiesPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 7 van 8
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Opties</h1>
      <p className="mt-4 text-muted-foreground">
        Voeg eventueel een sierlijke kaderrand toe langs de rand van je
        bordje. Deze stap is optioneel — je kunt hem ook gewoon overslaan.
      </p>

      <div className="mt-8">
        <OptionsSelector />
      </div>

      <ConfiguratorNav stepId="opties" />
    </div>
  );
}
