"use client";

import { ChevronDown } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes, productFonts } from "@/config/product-options";
import { houseNumberSchema, extraLineSchema } from "@/lib/validation/text-input.schema";
import { cn } from "@/lib/utils";

function fieldClass(hasError: boolean) {
  return cn(
    "w-full max-w-xs rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

// Lettertypekeuze per tekstveld — sinds 28-8-2026 een dropdown direct onder
// het bijbehorende tekstveld (was eerder een rij kaarten, en nog eerder een
// hele losse configuratorstap; op verzoek van Christiaan teruggebracht tot
// dit simpele menuutje, om stap 5 overzichtelijker te maken zonder de
// keuze-per-tekstveld zelf terug te draaien).
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
    <div className="mt-3">
      <label htmlFor={id} className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="relative max-w-xs">
        <select
          id={id}
          value={selectedFontId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none rounded-sm border border-border bg-secondary px-4 py-2.5 pr-9 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="" disabled>
            Kies een lettertype
          </option>
          {productFonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <p className="mt-1 text-xs text-muted-foreground">
          Letters en cijfers, maximaal 5 tekens (bv. 7, 12, 12A, A12, 123AB).
        </p>
        {numberCheck && !numberCheck.success && (
          <p className="mt-1 text-sm text-destructive">
            {numberCheck.error.issues[0]?.message}
          </p>
        )}
        <FontDropdown
          id="numberFontId"
          label="Lettertype huisnummer"
          selectedFontId={selection.numberFontId}
          onSelect={(fontId) => dispatch({ type: "SET_NUMBER_FONT", fontId })}
        />
      </div>

      {shape.extraLines >= 1 && (
        <div>
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
          <p className="mt-1 text-xs text-muted-foreground">Maximaal 20 tekens.</p>
          {line1Check && !line1Check.success && (
            <p className="mt-1 text-sm text-destructive">
              {line1Check.error.issues[0]?.message}
            </p>
          )}
          <FontDropdown
            id="line1FontId"
            label="Lettertype tekstregel 1"
            selectedFontId={selection.line1FontId}
            onSelect={(fontId) => dispatch({ type: "SET_LINE1_FONT", fontId })}
          />
        </div>
      )}

      {shape.extraLines >= 2 && (
        <div>
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
          <p className="mt-1 text-xs text-muted-foreground">Maximaal 20 tekens.</p>
          {line2Check && !line2Check.success && (
            <p className="mt-1 text-sm text-destructive">
              {line2Check.error.issues[0]?.message}
            </p>
          )}
          <FontDropdown
            id="line2FontId"
            label="Lettertype tekstregel 2"
            selectedFontId={selection.line2FontId}
            onSelect={(fontId) => dispatch({ type: "SET_LINE2_FONT", fontId })}
          />
        </div>
      )}
    </div>
  );
}
