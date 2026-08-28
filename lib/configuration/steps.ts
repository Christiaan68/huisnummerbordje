import type { ConfiguratorSelection } from "@/types/configuration";
import { productShapes } from "@/config/product-options";

export interface ConfiguratorStep {
  id: string;
  path: string;
  label: string;
  isComplete: (selection: ConfiguratorSelection) => boolean;
}

export const configuratorSteps: ConfiguratorStep[] = [
  {
    id: "vorm",
    path: "/configurator/vorm",
    label: "Vorm",
    isComplete: (s) => Boolean(s.shapeId),
  },
  {
    id: "afwerking",
    path: "/configurator/afwerking",
    label: "Afwerking",
    isComplete: (s) => Boolean(s.finish),
  },
  {
    id: "kleur",
    path: "/configurator/kleur",
    label: "Kleur",
    isComplete: (s) => Boolean(s.colorId),
  },
  {
    id: "maat",
    path: "/configurator/maat",
    label: "Maat",
    isComplete: (s) => Boolean(s.sizeId),
  },
  {
    id: "tekst",
    path: "/configurator/tekst",
    label: "Tekst",
    // Sinds 28-8-2026 kiest de klant hier meteen ook het lettertype per
    // tekstveld (de losse stap "Lettertype" is vervallen, op verzoek van
    // Christiaan) — dus deze stap is pas compleet als voor elk aanwezig
    // tekstveld zowel de tekst zelf als het lettertype zijn ingevuld.
    isComplete: (s) => {
      if (s.customText.trim().length === 0) return false;
      if (!s.numberFontId) return false;

      const shape = productShapes.find((shape) => shape.id === s.shapeId);
      if (!shape) return false;

      if (
        shape.extraLines >= 1 &&
        (s.extraLine1.trim().length === 0 || !s.line1FontId)
      ) {
        return false;
      }
      if (
        shape.extraLines >= 2 &&
        (s.extraLine2.trim().length === 0 || !s.line2FontId)
      ) {
        return false;
      }
      return true;
    },
  },
  {
    id: "opties",
    path: "/configurator/opties",
    label: "Opties",
    // Optioneel (het kader is een keuze, geen verplichte stap) — daarom
    // altijd "compleet", net als de laatste stap "controle".
    isComplete: () => true,
  },
  {
    id: "controle",
    path: "/configurator/controle",
    label: "Controle",
    isComplete: () => true,
  },
];

export function getStepIndex(path: string): number {
  return configuratorSteps.findIndex((step) => step.path === path);
}