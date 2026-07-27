import type { ConfiguratorSelection } from "@/types/configuration";
import { productShapes } from "@/config/product-options";

export interface ConfiguratorStep {
  id: string;
  path: string;
  label: string;
  isComplete: (selection: ConfiguratorSelection) => boolean;
}

function isValidSize(
  mm: number | null,
  range: { min: number; max: number }
): boolean {
  return mm !== null && mm >= range.min && mm <= range.max;
}

export const configuratorSteps: ConfiguratorStep[] = [
  {
    id: "vorm",
    path: "/configurator/vorm",
    label: "Vorm",
    // Compleet zodra er een vorm ÉN een afwerking gekozen is.
    isComplete: (s) => Boolean(s.shapeId) && Boolean(s.finish),
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
    isComplete: (s) => {
      if (s.customText.trim().length === 0) return false;

      const shape = productShapes.find((shape) => shape.id === s.shapeId);
      if (!shape) return false;

      if (shape.extraLines >= 1 && s.extraLine1.trim().length === 0) {
        return false;
      }
      if (shape.extraLines >= 2 && s.extraLine2.trim().length === 0) {
        return false;
      }
      return true;
    },
  },
  {
    id: "lettertype",
    path: "/configurator/lettertype",
    label: "Lettertype",
    isComplete: (s) => {
      if (!s.fontId) return false;

      const shape = productShapes.find((shape) => shape.id === s.shapeId);
      if (!shape) return false;

      if (!isValidSize(s.numberSizeMm, shape.characterSizeRange)) return false;
      if (
        shape.extraLines >= 1 &&
        !isValidSize(s.line1SizeMm, shape.lineSizeRange)
      ) {
        return false;
      }
      if (
        shape.extraLines >= 2 &&
        !isValidSize(s.line2SizeMm, shape.lineSizeRange)
      ) {
        return false;
      }
      return true;
    },
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
