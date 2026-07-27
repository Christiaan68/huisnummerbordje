import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { FontSelector } from "@/components/configurator/FontSelector";
import { CharacterSizeInputs } from "@/components/configurator/CharacterSizeInputs";

export default function LettertypePage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 5 van 6
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Lettertype</h1>
      <p className="mt-4 text-muted-foreground">
        Kies het lettertype voor jouw huisnummerbordje.
      </p>

      <div className="mt-8">
        <FontSelector />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-foreground">
          Tekengrootte
        </p>
        <CharacterSizeInputs />
      </div>

      <ConfiguratorNav stepId="lettertype" />
    </div>
  );
}
