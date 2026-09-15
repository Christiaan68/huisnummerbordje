import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { TextInput } from "@/components/configurator/TextInput";
import { NumberPositionToggle } from "@/components/configurator/NumberPositionToggle";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function TekstPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 5 van 7" title="Tekst" />
      <p className="mt-4 text-muted-foreground">
        Vul de tekst voor jouw huisnummerbordje in en kies meteen het
        lettertype per tekstveld.
      </p>

      <div className="mt-8">
        <TextInput />
      </div>

      <NumberPositionToggle />

      <ConfiguratorNav stepId="tekst" />
    </div>
  );
}