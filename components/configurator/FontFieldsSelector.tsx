"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import { InlineFontPicker } from "@/components/configurator/InlineFontPicker";

// Voorbeeldtekst voor een lettertype-kiezer zolang het bijbehorende veld nog
// leeg is (kan gebeuren als iemand rechtstreeks naar deze stap navigeert
// zonder eerst bij "Tekst" iets in te vullen) — zie InlineFontPicker.tsx.
const NUMBER_PLACEHOLDER_PREVIEW = "12";
const LINE_PLACEHOLDER_PREVIEW = "Voorbeeldtekst";

/**
 * Lettertypekeuze per tekstveld — sinds 28-8-2026 (nog dezelfde dag) weer
 * een losse configuratorstap ("Lettertype", na "Tekst"), op verzoek van
 * Christiaan omdat de gecombineerde stap 5 (tekst + lettertype door elkaar)
 * onoverzichtelijk oogde. De keuze zelf blijft wel per tekstveld (huisnummer/
 * tekstregel 1/tekstregel 2), dat is niet teruggedraaid — alleen de plek in
 * de configurator is weer gesplitst van het intypen van de tekst zelf.
 */
export function FontFieldsSelector() {
  const { selection, dispatch } = useConfigurator();
  const shape = productShapes.find((s) => s.id === selection.shapeId);

  if (!shape) {
    return (
      <p className="text-sm text-muted-foreground">
        Kies eerst een vorm en vul de tekst in om een lettertype te kiezen.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">
          Huisnummer
          {selection.customText && (
            <span className="font-normal text-muted-foreground">
              {" "}
              — “{selection.customText}”
            </span>
          )}
        </p>
        <InlineFontPicker
          label="Kies een lettertype voor het huisnummer"
          selectedFontId={selection.numberFontId}
          onSelect={(fontId) => dispatch({ type: "SET_NUMBER_FONT", fontId })}
          previewText={selection.customText || NUMBER_PLACEHOLDER_PREVIEW}
        />
      </div>

      {shape.extraLines >= 1 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">
            Tekstregel 1
            {selection.extraLine1 && (
              <span className="font-normal text-muted-foreground">
                {" "}
                — “{selection.extraLine1}”
              </span>
            )}
          </p>
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
          <p className="mb-1.5 text-sm font-medium text-foreground">
            Tekstregel 2
            {selection.extraLine2 && (
              <span className="font-normal text-muted-foreground">
                {" "}
                — “{selection.extraLine2}”
              </span>
            )}
          </p>
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
