import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { OptionsSelector } from "@/components/configurator/OptionsSelector";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function OptiesPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 6 van 7" title="Opties" />
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
