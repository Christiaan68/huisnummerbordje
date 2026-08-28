"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { useFontPreview, type FontPreviewField } from "@/lib/configuration/FontPreviewContext";
import { productShapes, productFonts } from "@/config/product-options";
import { houseNumberSchema, extraLineSchema } from "@/lib/validation/text-input.schema";
import { cn } from "@/lib/utils";

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

/**
 * Lettertypekeuze per tekstveld — staat sinds 28-8-2026 direct NAAST het
 * bijbehorende tekstveld (was eerst een rij kaarten, daarna een gewone
 * dropdown eronder, en kort een hele losse configuratorstap; op verzoek van
 * Christiaan uiteindelijk dit compacte menuutje, in hetzelfde blikveld als
 * de tekst zelf).
 *
 * Bewust een zelfgebouwd menuutje in plaats van een standaard HTML
 * `<select>`: zo kan tijdens het HANGEN met de muis boven een optie (nog
 * vóór het echt aanklikken) de "Live preview" rechts alvast dat lettertype
 * laten zien — bij een standaard `<select>` is de opengeklapte lijst
 * onderdeel van de browser/het besturingssysteem, waar geen hover-events
 * uit te lezen zijn. Zie lib/configuration/FontPreviewContext.tsx voor hoe
 * die tijdelijke preview (los van de echte, opgeslagen keuze) doorgegeven
 * wordt aan ProductPreview.tsx. Op telefoon/tablet is er geen muis, dus daar
 * gebeurt er simpelweg niets tijdens het aanraken — pas de daadwerkelijke
 * keuze (bij het tikken op een optie) telt, precies zoals gevraagd.
 */
function FontDropdown({
  id,
  field,
  selectedFontId,
  onSelect,
}: {
  id: string;
  field: FontPreviewField;
  selectedFontId: string | null;
  onSelect: (fontId: string) => void;
}) {
  const { setOverride } = useFontPreview();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedFont = productFonts.find((f) => f.id === selectedFontId);
  const labelId = `${id}-label`;

  useEffect(() => {
    if (!open) return;

    function closeAndClear() {
      setOpen(false);
      setOverride(null);
    }

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAndClear();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAndClear();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOverride]);

  return (
    <div ref={containerRef} className="relative w-36 shrink-0 sm:w-40">
      <label id={labelId} htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted-foreground">
        Lettertype
      </label>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}`}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (!next) setOverride(null);
        }}
        className="flex w-full items-center justify-between rounded-sm border border-border bg-secondary px-3 py-3 text-left text-sm text-foreground outline-none focus:border-primary"
      >
        <span className="truncate">{selectedFont?.name ?? "Kies..."}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-sm border border-border bg-card shadow-lg"
        >
          {productFonts.map((font) => {
            const isSelected = font.id === selectedFontId;
            return (
              <li key={font.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setOverride({ field, fontId: font.id })}
                  onMouseLeave={() => setOverride(null)}
                  onFocus={() => setOverride({ field, fontId: font.id })}
                  onBlur={() => setOverride(null)}
                  onClick={() => {
                    onSelect(font.id);
                    setOverride(null);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground hover:bg-secondary",
                    isSelected && "bg-secondary/70"
                  )}
                >
                  <span style={{ fontFamily: font.cssFamily }}>{font.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
            field="numberFontId"
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
              field="line1FontId"
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
              field="line2FontId"
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
