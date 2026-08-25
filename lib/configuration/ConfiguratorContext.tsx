"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  emptyConfiguratorSelection,
  type ConfiguratorSelection,
} from "@/types/configuration";
import type { PlateFinish } from "@/types/product";
import { productShapes } from "@/config/product-options";

type NumberPosition = "start" | "middle" | "end";

type Action =
  | { type: "SET_SHAPE"; shapeId: string }
  | { type: "SET_FINISH"; finish: PlateFinish }
  | { type: "SET_COLOR"; colorId: string }
  | { type: "SET_SIZE"; sizeId: string }
  | { type: "SET_TEXT"; customText: string }
  | { type: "SET_EXTRA_LINE_1"; value: string }
  | { type: "SET_EXTRA_LINE_2"; value: string }
  | { type: "SET_FONT"; fontId: string }
  | { type: "SET_NUMBER_POSITION"; position: NumberPosition }
  | { type: "SET_HAS_FRAME"; hasFrame: boolean }
  | { type: "RESET" };

function reducer(
  state: ConfiguratorSelection,
  action: Action
): ConfiguratorSelection {
  switch (action.type) {
    case "SET_SHAPE": {
      const shape = productShapes.find((s) => s.id === action.shapeId);
      const finish: PlateFinish | null =
        shape && shape.availableFinishes.length === 1
          ? shape.availableFinishes[0]
          : null;

      // De kaderoptie bestaat alleen voor niet-ovale vormen (besloten door
      // Christiaan, 25-8-2026) — bij het kiezen van "ovaal" wordt een
      // eerder aangevinkt kader dus automatisch weer uitgezet, net zoals
      // hierboven al met "finish" en "sizeId" gebeurt.
      const hasFrame = action.shapeId === "ovaal" ? false : state.hasFrame;

      return {
        ...state,
        shapeId: action.shapeId,
        finish,
        sizeId: null,
        numberPosition: "start",
        hasFrame,
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