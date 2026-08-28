import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { FontFieldsSelector } from "@/components/configurator/FontFieldsSelector";

export default function LettertypePage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 6 van 8
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Lettertype</h1>
      <p className="mt-4 text-muted-foreground">
        Kies een lettertype voor het huisnummer en, als je die hebt, voor de
        tekstregel(s). Je ziet meteen hoe jouw eigen tekst in elk lettertype
        oogt.
      </p>

      <div className="mt-8">
        <FontFieldsSelector />
      </div>

      <ConfiguratorNav stepId="lettertype" />
    </div>
  );
}
