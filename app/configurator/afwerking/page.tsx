import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { FinishSelector } from "@/components/configurator/FinishSelector";

export default function AfwerkingPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 2 van 8
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">Afwerking</h1>
      <p className="mt-4 text-muted-foreground">
        Kies of je een vlak of gewelfd emaille bordje wilt.
      </p>

      <div className="mt-8">
        <FinishSelector />
      </div>

      <ConfiguratorNav stepId="afwerking" />
    </div>
  );
}
