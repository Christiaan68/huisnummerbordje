"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  emptyConfiguratorSelection,
  type ConfiguratorSelection,
} from "@/types/configuration";
import type { PlateFinish } from "@/types/product";
import { productShapes } from "@/config/product-options";

type Action =
  | { type: "SET_SHAPE"; shapeId: string }
  | { type: "SET_FINISH"; finish: PlateFinish }
  | { type: "SET_COLOR"; colorId: string }
  | { type: "SET_SIZE"; sizeId: string }
  | { type: "SET_TEXT"; customText: string }
  | { type: "SET_EXTRA_LINE_1"; value: string }
  | { type: "SET_EXTRA_LINE_2"; value: string }
  | { type: "SET_FONT"; fontId: string }
  | { type: "SET_NUMBER_SIZE"; mm: number | null }
  | { type: "SET_LINE1_SIZE"; mm: number | null }
  | { type: "SET_LINE2_SIZE"; mm: number | null }
  | { type: "RESET" };

function reducer(
  state: ConfiguratorSelection,
  action: Action
): ConfiguratorSelection {
  switch (action.type) {
    case "SET_SHAPE": {
      const shape = productShapes.find((s) => s.id === action.shapeId);
      // Bij het wisselen van vorm: maat en tekengroottes opnieuw laten
      // kiezen (beide zijn vorm-specifiek, o.a. door de mm-range), en
      // afwerking automatisch invullen als er voor deze vorm maar één
      // afwerking mogelijk is.
      const finish: PlateFinish | null =
        shape && shape.availableFinishes.length === 1
          ? shape.availableFinishes[0]
          : null;

      return {
        ...state,
        shapeId: action.shapeId,
        finish,
        sizeId: null,
        numberSizeMm: null,
        line1SizeMm: null,
        line2SizeMm: null,
      };
    }
    case "SET_FINISH":
      return { ...state, finish: action.finish };
    case "SET_COLOR":
      return { ...state, colorId: action.colorId };
    case "SET_SIZE":
      return { ...state, sizeId: action.sizeId };
    case "SET_TEXT":
      return { ...state, customText: action.customText };
    case "SET_EXTRA_LINE_1":
      return { ...state, extraLine1: action.value };
    case "SET_EXTRA_LINE_2":
      return { ...state, extraLine2: action.value };
    case "SET_FONT":
      return { ...state, fontId: action.fontId };
    case "SET_NUMBER_SIZE":
      return { ...state, numberSizeMm: action.mm };
    case "SET_LINE1_SIZE":
      return { ...state, line1SizeMm: action.mm };
    case "SET_LINE2_SIZE":
      return { ...state, line2SizeMm: action.mm };
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
