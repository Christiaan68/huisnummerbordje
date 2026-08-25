import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { FontSelector } from "@/components/configurator/FontSelector";

export default function LettertypePage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 7 van 8
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Lettertype</h1>
      <p className="mt-4 text-muted-foreground">
        Kies het lettertype voor jouw huisnummerbordje. De tekengrootte
        wordt automatisch berekend zodat de tekst het bordje optimaal vult.
      </p>

      <div className="mt-8">
        <FontSelector />
      </div>

      <ConfiguratorNav stepId="lettertype" />
    </div>
  );
}