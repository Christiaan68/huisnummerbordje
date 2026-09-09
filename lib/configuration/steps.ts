import type { ConfiguratorSelection } from "@/types/configuration";
import type { ProductShape } from "@/types/product";
import { productShapes } from "@/config/product-options";
import { isEarsShape } from "@/lib/configuration/shape-helpers";

export interface ConfiguratorStep {
  id: string;
  path: string;
  label: string;
  isComplete: (selection: ConfiguratorSelection) => boolean;
  /**
   * Of deze stap voor de (eventueel nog niet gekozen) vorm getoond moet
   * worden — toegevoegd 9-9-2026 bij de uitbreiding naar 7 vormen. Vóórdat
   * er een vorm gekozen is (`shape` is `undefined`, bv. tijdens stap 1 zelf)
   * blijft elke stap "zichtbaar": er is dan nog niets om op te filteren, en
   * dit hoort niet de stappenlijst te laten inklappen voordat de klant
   * sowieso nog moet kiezen.
   *
   * De 4 oorspronkelijke vormen hebben alle capability-vlaggen op `true`
   * staan (zie config/product-options.ts), dus voor hen is elke stap
   * hieronder nog steeds altijd zichtbaar — ongewijzigd gedrag.
   */
  visibleFor: (shape: ProductShape | undefined) => boolean;
}

export const configuratorSteps: ConfiguratorStep[] = [
  {
    id: "vorm",
    path: "/configurator/vorm",
    label: "Vorm",
    isComplete: (s) => Boolean(s.shapeId),
    visibleFor: () => true,
  },
  {
    id: "afwerking",
    path: "/configurator/afwerking",
    label: "Afwerking",
    isComplete: (s) => Boolean(s.finish),
    visibleFor: (shape) => shape?.hasFinishChoice ?? true,
  },
  {
    id: "kleur",
    path: "/configurator/kleur",
    label: "Kleur",
    // Voor colorMode "ears-and-plate"-vormen (nieuw 9-9-2026) zijn er 2
    // losse verplichte kleuren (oren + vlak) in plaats van de ene `colorId`
    // — zie ColorSelector.tsx en types/configuration.ts.
    isComplete: (s) => {
      const shape = productShapes.find((shape) => shape.id === s.shapeId);
      if (isEarsShape(shape)) {
        return Boolean(s.earColorId) && Boolean(s.plateColorId);
      }
      return Boolean(s.colorId);
    },
    // Deze stap blijft voor ALLE vormen zichtbaar (ook "oren"-vormen) — enkel
    // het gedrag erbinnen verandert, niet de zichtbaarheid.
    visibleFor: () => true,
  },
  {
    id: "maat",
    path: "/configurator/maat",
    label: "Maat",
    isComplete: (s) => Boolean(s.sizeId),
    visibleFor: (shape) => shape?.hasSizeChoice ?? true,
  },
  {
    id: "tekst",
    path: "/configurator/tekst",
    label: "Tekst",
    // Sinds 28-8-2026 kiest de klant hier meteen ook het lettertype per
    // tekstveld (via een dropdown onder elk veld, zie TextInput.tsx) — dus
    // deze stap is pas compleet als voor elk aanwezig tekstveld zowel de
    // tekst zelf als het lettertype zijn ingevuld. Voor "oren"-vormen (nieuw
    // 9-9-2026, hasFontChoice: false) bestaat er geen lettertypekeuze en ook
    // geen extra tekstregels (extraLines is bij die vormen altijd 0) — daar
    // is deze stap dus al compleet zodra het huisnummerveld niet leeg is.
    isComplete: (s) => {
      if (s.customText.trim().length === 0) return false;

      const shape = productShapes.find((shape) => shape.id === s.shapeId);
      if (!shape) return false;

      if (isEarsShape(shape)) return true;

      if (!s.numberFontId) return false;

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
    // Blijft voor alle vormen zichtbaar — er is altijd een huisnummerveld.
    visibleFor: () => true,
  },
  {
    id: "opties",
    path: "/configurator/opties",
    label: "Opties",
    // Optioneel (het kader is een keuze, geen verplichte stap) — daarom
    // altijd "compleet", net als de laatste stap "controle".
    isComplete: () => true,
    visibleFor: (shape) => shape?.hasFrameChoice ?? true,
  },
  {
    id: "controle",
    path: "/configurator/controle",
    label: "Controle",
    isComplete: () => true,
    visibleFor: () => true,
  },
];

/**
 * De stappenlijst zoals die voor de (eventueel nog niet gekozen) vorm in
 * `selection` getoond moet worden — dus met stappen die voor deze vorm niet
 * van toepassing zijn (bv. "Afwerking"/"Maat"/"Opties" bij een
 * "oren"-vorm) eruit gefilterd. Gebruikt door de navigatie-/
 * voortgangscomponenten (ConfiguratorNav.tsx, ProgressIndicator.tsx) zodat
 * de klant die stappen nooit te zien krijgt en er ook niet per ongeluk naar
 * "Terug"/"Verder" genavigeerd kan worden.
 *
 * Rechtstreekse navigatie naar de URL van een overgeslagen stap (bv. iemand
 * plakt "/configurator/maat" handmatig in de adresbalk bij een "oren"-vorm)
 * wordt hier NIET tegengehouden — dat gebeurde vóór 9-9-2026 ook al niet
 * voor de stappenvolgorde in het algemeen, en valt buiten de scope van deze
 * uitbreiding.
 */
export function getVisibleSteps(selection: ConfiguratorSelection): ConfiguratorStep[] {
  const shape = productShapes.find((s) => s.id === selection.shapeId);
  return configuratorSteps.filter((step) => step.visibleFor(shape));
}

export function getStepIndex(path: string): number {
  return configuratorSteps.findIndex((step) => step.path === path);
}
