import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { TextInput } from "@/components/configurator/TextInput";
import { NumberPositionToggle } from "@/components/configurator/NumberPositionToggle";

export default function TekstPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 5 van 7
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Tekst</h1>
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