"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";

type Position = "start" | "middle" | "end";

const labels: Record<string, string> = {
  number: "Huisnummer",
  line1: "Tekstregel 1",
  line2: "Tekstregel 2",
};

function getOrder(extraLines: number, position: Position): string[] {
  if (extraLines === 0) return ["number"];
  if (extraLines === 1) {
    return position === "end" ? ["line1", "number"] : ["number", "line1"];
  }
  if (position === "middle") return ["line1", "number", "line2"];
  if (position === "end") return ["line1", "line2", "number"];
  return ["number", "line1", "line2"];
}

function nextPosition(extraLines: number, current: Position): Position {
  if (extraLines === 1) {
    return current === "start" ? "end" : "start";
  }
  if (current === "start") return "middle";
  if (current === "middle") return "end";
  return "start";
}

export function NumberPositionToggle() {
  const { selection, dispatch } = useConfigurator();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (!shape || shape.extraLines === 0) return null;

  const order = getOrder(shape.extraLines, selection.numberPosition);

  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-medium text-foreground">
        Volgorde op het bordje
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ol className="space-y-1 text-sm text-muted-foreground">
          {order.map((key, index) => (
            <li key={key}>
              {index + 1}. {labels[key]}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "SET_NUMBER_POSITION",
              position: nextPosition(shape.extraLines, selection.numberPosition),
            })
          }
          className="rounded-sm border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50"
        >
          Volgorde wisselen
        </button>
      </div>
    </div>
  );
}