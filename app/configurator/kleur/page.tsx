import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { ColorSelector } from "@/components/configurator/ColorSelector";

export default function KleurPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 3 van 8
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Kleur</h1>
      <p className="mt-4 text-muted-foreground">
        Kies de kleur van jouw huisnummerbordje. Zwart, Wit en Donkerblauw
        zijn de standaardkleuren en zitten bij de prijs inbegrepen. Voor de
        overige kleuren geldt een meerprijs.
      </p>

      <div className="mt-8">
        <ColorSelector />
      </div>

      <ConfiguratorNav stepId="kleur" />
    </div>
  );
}
