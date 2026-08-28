"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import { houseNumberSchema, extraLineSchema } from "@/lib/validation/text-input.schema";
import { InlineFontPicker } from "@/components/configurator/InlineFontPicker";
import { cn } from "@/lib/utils";

// Voorbeeldtekst voor het lettertype-kiezertje onder een veld zolang de
// klant daar zelf nog niets heeft getypt — zie InlineFontPicker.tsx.
const NUMBER_PLACEHOLDER_PREVIEW = "12";
const LINE_PLACEHOLDER_PREVIEW = "Voorbeeldtekst";

function fieldClass(hasError: boolean) {
  return cn(
    "w-full max-w-xs rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
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
        <InlineFontPicker
          label="Kies een lettertype voor het huisnummer"
          selectedFontId={selection.numberFontId}
          onSelect={(fontId) => dispatch({ type: "SET_NUMBER_FONT", fontId })}
          previewText={selection.customText || NUMBER_PLACEHOLDER_PREVIEW}
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
          <InlineFontPicker
            label="Kies een lettertype voor tekstregel 1"
            selectedFontId={selection.line1FontId}
            onSelect={(fontId) => dispatch({ type: "SET_LINE1_FONT", fontId })}
            previewText={selection.extraLine1 || LINE_PLACEHOLDER_PREVIEW}
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
          <InlineFontPicker
            label="Kies een lettertype voor tekstregel 2"
            selectedFontId={selection.line2FontId}
            onSelect={(fontId) => dispatch({ type: "SET_LINE2_FONT", fontId })}
            previewText={selection.extraLine2 || LINE_PLACEHOLDER_PREVIEW}
          />
        </div>
      )}
    </div>
  );
}