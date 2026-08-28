"use client";

import { Check } from "lucide-react";
import { productFonts } from "@/config/product-options";
import { cn } from "@/lib/utils";

interface InlineFontPickerProps {
  /** Het momenteel gekozen lettertype-id voor dit tekstveld, of null. */
  selectedFontId: string | null;
  onSelect: (fontId: string) => void;
  /**
   * De tekst die in elk lettertype-voorbeeld getoond wordt — bij voorkeur
   * de tekst die de klant zelf in dit veld heeft getypt, zodat direct te
   * zien is hoe DIE tekst in elk lettertype oogt (i.p.v. een generiek
   * voorbeeld). Leeg → een neutrale placeholder (zie defaultPreviewText
   * hieronder).
   */
  previewText: string;
  /** aria-label voor de radiogroup, bv. "Kies een lettertype voor het huisnummer". */
  label: string;
}

/**
 * Kleine, per-tekstveld lettertypekiezer — toegevoegd 28-8-2026 op verzoek
 * van Christiaan ("elke tekst of nummer dat ik in moet typen, moet het
 * lettertype gewijzigd kunnen worden"). Vervangt de losse configuratorstap
 * "Lettertype" (voorheen components/configurator/FontSelector.tsx, met 1
 * lettertype voor het hele bordje): dit component wordt nu 1x per
 * tekstveld (huisnummer/tekstregel 1/tekstregel 2) direct onder dat veld
 * getoond, zie TextInput.tsx.
 *
 * Toont — anders dan de oude FontSelector, die een vaste voorbeeldtekst
 * "12" gebruikte — bij voorkeur de daadwerkelijk getypte tekst van dit
 * veld, in elk lettertype. Zo ziet de klant meteen hoe zijn/haar eigen
 * huisnummer of tekst er in elk lettertype uitziet.
 */
export function InlineFontPicker({
  selectedFontId,
  onSelect,
  previewText,
  label,
}: InlineFontPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="mt-3 flex flex-wrap gap-2"
    >
      {productFonts.map((font) => {
        const isSelected = selectedFontId === font.id;

        return (
          <button
            key={font.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(font.id)}
            className={cn(
              "flex min-w-[6.5rem] max-w-[10rem] flex-col items-start gap-1 rounded-sm border bg-card px-3 py-2 text-left transition-colors",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex w-full items-center justify-between gap-1">
              <span
                className="truncate text-base leading-tight text-foreground"
                style={{ fontFamily: font.cssFamily }}
              >
                {previewText}
              </span>
              {isSelected && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {font.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
