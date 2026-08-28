"use client";

import { ChevronDown } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes, productFonts } from "@/config/product-options";
import { houseNumberSchema, extraLineSchema } from "@/lib/validation/text-input.schema";
import { cn } from "@/lib/utils";

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

// Lettertypekeuze per tekstveld — een dropdown die sinds 28-8-2026 direct
// NAAST het bijbehorende tekstveld staat (was eerst een rij kaarten, daarna
// een dropdown onder het veld, en kort een hele losse configuratorstap — op
// verzoek van Christiaan uiteindelijk dit: compact, in hetzelfde blikveld
// als de tekst zelf). De live preview rechts (ProductPreview.tsx) leest
// dezelfde configurator-state en tekent bij elke wijziging meteen opnieuw —
// daar is voor deze dropdown zelf dus niets extra's voor nodig.
function FontDropdown({
  id,
  label,
  selectedFontId,
  onSelect,
}: {
  id: string;
  label: string;
  selectedFontId: string | null;
  onSelect: (fontId: string) => void;
}) {
  return (
    <div className="w-36 shrink-0 sm:w-40">
      <label htmlFor={id} className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={selectedFontId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none rounded-sm border border-border bg-secondary px-3 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="" disabled>
            Kies...
          </option>
          {productFonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

export function TextInput() {
  const { selection, dispatch } = useConfigurator();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (!shape) {
    return (
      <p className="text-sm text-muted-foreground">
        Kies eerst een vorm om de tekst in te vullen.
      </p>
    );
  }

  const numberCheck =
    selection.customText.length > 0
      ? houseNumberSchema.safeParse(selection.customText)
      : null;
  const line1Check =
    selection.extraLine1.length > 0
      ? extraLineSchema.safeParse(selection.extraLine1)
      : null;
  const line2Check =
    selection.extraLine2.length > 0
      ? extraLineSchema.safeParse(selection.extraLine2)
      : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[160px] max-w-xs flex-1">
            <label htmlFor="customText" className="mb-1.5 block text-sm font-medium text-foreground">
              Huisnummer
            </label>
            <input
              id="customText"
              type="text"
              maxLength={5}
              value={selection.customText}
              onChange={(e) =>
                dispatch({ type: "SET_TEXT", customText: e.target.value })
              }
              placeholder="bv. 12a"
              className={fieldClass(!!numberCheck && !numberCheck.success)}
            />
          </div>
          <FontDropdown
            id="numberFontId"
            label="Lettertype"
            selectedFontId={selection.numberFontId}
            onSelect={(fontId) => dispatch({ type: "SET_NUMBER_FONT", fontId })}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Letters en cijfers, maximaal 5 tekens (bv. 7, 12, 12A, A12, 123AB).
        </p>
        {numberCheck && !numberCheck.success && (
          <p className="mt-1 text-sm text-destructive">
            {numberCheck.error.issues[0]?.message}
          </p>
        )}
      </div>

      {shape.extraLines >= 1 && (
        <div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[160px] max-w-xs flex-1">
              <label htmlFor="extraLine1" className="mb-1.5 block text-sm font-medium text-foreground">
                Tekstregel 1
              </label>
              <input
                id="extraLine1"
                type="text"
                maxLength={20}
                value={selection.extraLine1}
                onChange={(e) =>
                  dispatch({ type: "SET_EXTRA_LINE_1", value: e.target.value })
                }
                placeholder="bv. Familie Jansen"
                className={fieldClass(!!line1Check && !line1Check.success)}
              />
            </div>
            <FontDropdown
              id="line1FontId"
              label="Lettertype"
              selectedFontId={selection.line1FontId}
              onSelect={(fontId) => dispatch({ type: "SET_LINE1_FONT", fontId })}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Maximaal 20 tekens.</p>
          {line1Check && !line1Check.success && (
            <p className="mt-1 text-sm text-destructive">
              {line1Check.error.issues[0]?.message}
            </p>
          )}
        </div>
      )}

      {shape.extraLines >= 2 && (
        <div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[160px] max-w-xs flex-1">
              <label htmlFor="extraLine2" className="mb-1.5 block text-sm font-medium text-foreground">
                Tekstregel 2
              </label>
              <input
                id="extraLine2"
                type="text"
                maxLength={20}
                value={selection.extraLine2}
                onChange={(e) =>
                  dispatch({ type: "SET_EXTRA_LINE_2", value: e.target.value })
                }
                placeholder="bv. Amsterdam"
                className={fieldClass(!!line2Check && !line2Check.success)}
              />
            </div>
            <FontDropdown
              id="line2FontId"
              label="Lettertype"
              selectedFontId={selection.line2FontId}
              onSelect={(fontId) => dispatch({ type: "SET_LINE2_FONT", fontId })}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Maximaal 20 tekens.</p>
          {line2Check && !line2Check.success && (
            <p className="mt-1 text-sm text-destructive">
              {line2Check.error.issues[0]?.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
