"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  emptyConfiguratorSelection,
  type ConfiguratorSelection,
} from "@/types/configuration";
import type { PlateFinish } from "@/types/product";
import { productShapes, productSizes } from "@/config/product-options";

type NumberPosition = "start" | "middle" | "end";

type Action =
  | { type: "SET_SHAPE"; shapeId: string }
  | { type: "SET_FINISH"; finish: PlateFinish }
  | { type: "SET_COLOR"; colorId: string }
  // Toegevoegd 9-9-2026 voor de 3 "oren"-vormen (colorMode
  // "ears-and-plate"): losse acties voor de kleur van de oren en van het
  // vlak, naast de bestaande SET_COLOR (die voor colorMode "single"-vormen
  // blijft gelden). Zie types/configuration.ts.
  | { type: "SET_EAR_COLOR"; colorId: string }
  | { type: "SET_PLATE_COLOR"; colorId: string }
  | { type: "SET_SIZE"; sizeId: string }
  | { type: "SET_TEXT"; customText: string }
  | { type: "SET_EXTRA_LINE_1"; value: string }
  | { type: "SET_EXTRA_LINE_2"; value: string }
  | { type: "SET_NUMBER_FONT"; fontId: string }
  | { type: "SET_LINE1_FONT"; fontId: string }
  | { type: "SET_LINE2_FONT"; fontId: string }
  | { type: "SET_NUMBER_POSITION"; position: NumberPosition }
  | { type: "SET_HAS_FRAME"; hasFrame: boolean }
  | { type: "RESET" };

function reducer(
  state: ConfiguratorSelection,
  action: Action
): ConfiguratorSelection {
  switch (action.type) {
    case "SET_SHAPE": {
      const newShape = productShapes.find((s) => s.id === action.shapeId);
      const oldShape = productShapes.find((s) => s.id === state.shapeId);

      // Afwerking: ongewijzigd voor vormen mét afwerkingskeuze (bestaand
      // gedrag — 1 mogelijke afwerking wordt meteen gezet, anders moet de
      // klant nog kiezen). Vormen ZONDER afwerkingsbegrip (hasFinishChoice:
      // false, de 3 nieuwe "oren"-vormen) krijgen hier expliciet `null` —
      // dat zou via `availableFinishes` (bij hen een lege lijst) toevallig
      // ook al uitkomen, maar is hier met opzet niet stilzwijgend
      // overgelaten aan die (voor deze vormen ongebruikte) lijst.
      const finish: PlateFinish | null =
        newShape && !newShape.hasFinishChoice
          ? null
          : newShape && newShape.availableFinishes.length === 1
            ? newShape.availableFinishes[0]
            : null;

      // Maat: bij vormen zonder maatkeuze (hasSizeChoice: false) is er maar
      // 1 bijbehorende maat in productSizes — die wordt hier meteen gezet,
      // zodat de klant niet apart hoeft te klikken (de stap "Maat" wordt
      // bovendien helemaal overgeslagen, zie lib/configuration/steps.ts,
      // getVisibleSteps). Voor vormen mét maatkeuze blijft dit bestaande
      // gedrag: sizeId wordt leeggemaakt, de klant kiest opnieuw.
      const sizeId =
        newShape && !newShape.hasSizeChoice
          ? productSizes.find((size) => size.shapeId === action.shapeId)?.id ?? null
          : null;

      // Kleur: blijft bestaand gedrag behouden zolang colorMode gelijk
      // blijft (bv. wisselen tussen twee colorMode "single"-vormen, of
      // tussen twee colorMode "ears-and-plate"-vormen) — de kleurkeuze mag
      // dan niet verloren gaan. Wisselt colorMode WEL (bv. van "nummer" naar
      // "oren-4-hoeken", of omgekeerd), dan wordt het niet meer relevante
      // veld/de niet meer relevante velden leeggemaakt: `colorId` bij het
      // ingaan van "ears-and-plate", `earColorId`/`plateColorId` bij het
      // verlaten ervan.
      const colorModeChanged = oldShape?.colorMode !== newShape?.colorMode;
      const colorId = colorModeChanged ? null : state.colorId;
      const earColorId = colorModeChanged ? null : state.earColorId;
      const plateColorId = colorModeChanged ? null : state.plateColorId;

      // Lettertype: vormen zonder lettertypekeuze (hasFontChoice: false)
      // kennen geen enkel lettertypeveld — alle 3 worden dan leeggemaakt.
      // Voor vormen mét lettertypekeuze blijft een eerder gekozen
      // lettertype gewoon staan bij het wisselen van vorm (bestaand gedrag).
      const fontFieldsCleared = Boolean(newShape && !newShape.hasFontChoice);

      // Kader: de kaderoptie is sinds 28-8-2026 voor alle vormen mét
      // kaderkeuze beschikbaar, en een eerder aangevinkt kader hoeft dan
      // niet automatisch uitgezet te worden bij het wisselen van vorm (zie
      // de oorspronkelijke toelichting hieronder, nog steeds geldig voor die
      // vormen). Vormen ZONDER kaderoptie (hasFrameChoice: false, de 3
      // nieuwe "oren"-vormen) kennen dit begrip niet — zodat
      // frameSurchargeCents voor hen altijd 0 blijft (zie
      // lib/configuration/pricing.ts), wordt `hasFrame` bij het ingaan van
      // zo'n vorm expliciet teruggezet naar `false`.
      const hasFrame = newShape && !newShape.hasFrameChoice ? false : state.hasFrame;

      return {
        ...state,
        shapeId: action.shapeId,
        finish,
        sizeId,
        numberPosition: "start",
        colorId,
        earColorId,
        plateColorId,
        numberFontId: fontFieldsCleared ? null : state.numberFontId,
        line1FontId: fontFieldsCleared ? null : state.line1FontId,
        line2FontId: fontFieldsCleared ? null : state.line2FontId,
        hasFrame,
      };
    }
    case "SET_FINISH":
      return { ...state, finish: action.finish };
    case "SET_COLOR":
      return { ...state, colorId: action.colorId };
    case "SET_EAR_COLOR":
      return { ...state, earColorId: action.colorId };
    case "SET_PLATE_COLOR":
      return { ...state, plateColorId: action.colorId };
    case "SET_SIZE":
      return { ...state, sizeId: action.sizeId };
    case "SET_TEXT":
      return { ...state, customText: action.customText };
    case "SET_EXTRA_LINE_1":
      return { ...state, extraLine1: action.value };
    case "SET_EXTRA_LINE_2":
      return { ...state, extraLine2: action.value };
    case "SET_NUMBER_FONT":
      return { ...state, numberFontId: action.fontId };
    case "SET_LINE1_FONT":
      return { ...state, line1FontId: action.fontId };
    case "SET_LINE2_FONT":
      return { ...state, line2FontId: action.fontId };
    case "SET_NUMBER_POSITION":
      return { ...state, numberPosition: action.position };
    case "SET_HAS_FRAME":
      return { ...state, hasFrame: action.hasFrame };
    case "RESET":
      return emptyConfiguratorSelection;
    default:
      return state;
  }
}

interface ConfiguratorContextValue {
  selection: ConfiguratorSelection;
  dispatch: React.Dispatch<Action>;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(
  null
);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [selection, dispatch] = useReducer(reducer, emptyConfiguratorSelection);

  return (
    <ConfiguratorContext.Provider value={{ selection, dispatch }}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error(
      "useConfigurator moet gebruikt worden binnen een ConfiguratorProvider"
    );
  }
  return context;
}