import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { ColorSelector } from "@/components/configurator/ColorSelector";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function KleurPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 3 van 7" title="Kleur" />
      <p className="mt-4 text-muted-foreground">
        Kies eerst de ondergrondkleur (de achtergrond) en daarna de
        opdrukkleur (het huisnummer en eventuele tekstregels) van jouw
        huisnummerbordje. Zwart, Wit en Donkerblauw zijn de standaardkleuren
        en zitten bij de prijs inbegrepen. Voor de overige kleuren geldt een
        meerprijs — deze geldt per gekozen kleur, dus mogelijk tot twee keer.
      </p>

      <div className="mt-8">
        <ColorSelector />
      </div>

      <ConfiguratorNav stepId="kleur" />
    </div>
  );
}
