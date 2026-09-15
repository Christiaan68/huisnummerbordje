import { ConfiguratorNav } from "@/components/configurator/ConfiguratorNav";
import { FinishSelector } from "@/components/configurator/FinishSelector";
import { StepHeader } from "@/components/configurator/StepHeader";

export default function AfwerkingPage() {
  return (
    <div>
      <StepHeader eyebrow="Configurator — stap 2 van 7" title="Afwerking" />
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
