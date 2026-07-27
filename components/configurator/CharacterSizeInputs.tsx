"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import { cn } from "@/lib/utils";

interface SizeFieldProps {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (mm: number | null) => void;
}

function SizeField({ label, value, min, max, onChange }: SizeFieldProps) {
  const isOutOfRange = value !== null && (value < min || value > max);

  return (
    <div>
      <label className="mb-1.5 block text-sm text-muted-foreground">
        {label}
      </label>
      <div className="relative w-40">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? null : Number(raw));
          }}
          placeholder={`${min}-${max}`}
          className={cn(
            "w-full rounded-sm border bg-card px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-primary",
            isOutOfRange ? "border-destructive" : "border-border"
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          mm
        </span>
      </div>
      {isOutOfRange && (
        <p className="mt-1 text-xs text-destructive">
          Moet tussen {min} en {max} mm liggen.
        </p>
      )}
    </div>
  );
}

export function CharacterSizeInputs() {
  const { selection, dispatch } = useConfigurator();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (!shape) {
    return (
      <p className="text-sm text-muted-foreground">
        Kies eerst een vorm om de tekengrootte in te stellen.
      </p>
    );
  }

  const { min, max } = shape.characterSizeRange;
  const { min: lineMin, max: lineMax } = shape.lineSizeRange;

  return (
    <div className="flex flex-wrap gap-6">
      <SizeField
        label="Huisnummer"
        value={selection.numberSizeMm}
        min={min}
        max={max}
        onChange={(mm) => dispatch({ type: "SET_NUMBER_SIZE", mm })}
      />
      {shape.extraLines >= 1 && (
        <SizeField
          label="Tekstregel 1"
          value={selection.line1SizeMm}
          min={lineMin}
          max={lineMax}
          onChange={(mm) => dispatch({ type: "SET_LINE1_SIZE", mm })}
        />
      )}
      {shape.extraLines >= 2 && (
        <SizeField
          label="Tekstregel 2"
          value={selection.line2SizeMm}
          min={lineMin}
          max={lineMax}
          onChange={(mm) => dispatch({ type: "SET_LINE2_SIZE", mm })}
        />
      )}
    </div>
  );
}
