"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type FontPreviewField = "numberFontId" | "line1FontId" | "line2FontId";

interface FontPreviewOverride {
  field: FontPreviewField;
  fontId: string;
}

interface FontPreviewContextValue {
  /**
   * Als iemand met de muis over een lettertype-optie in de dropdown hangt
   * (zonder 'm al te hebben aangeklikt), staat hier tijdelijk welk veld en
   * welk lettertype dat is — zie components/configurator/TextInput.tsx. De
   * "Live preview" (ProductPreview.tsx) toont dan alvast dát lettertype,
   * zonder de echte configurator-keuze (ConfiguratorContext) al aan te
   * passen. Zodra de muis weggaat of er echt geklikt wordt, gaat dit weer
   * naar null.
   */
  override: FontPreviewOverride | null;
  setOverride: (override: FontPreviewOverride | null) => void;
}

const FontPreviewContext = createContext<FontPreviewContextValue | null>(null);

/**
 * Losse, lichte context (naast ConfiguratorContext) puur voor deze
 * tijdelijke hover-preview — bewust niet in ConfiguratorContext zelf
 * gestopt, zodat "hangen boven een optie" nooit de echte, opgeslagen
 * configuratie (en de stap-compleet-validatie die daarop leunt) kan
 * beïnvloeden.
 */
export function FontPreviewProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<FontPreviewOverride | null>(null);
  const value = useMemo(() => ({ override, setOverride }), [override]);

  return (
    <FontPreviewContext.Provider value={value}>
      {children}
    </FontPreviewContext.Provider>
  );
}

export function useFontPreview(): FontPreviewContextValue {
  const ctx = useContext(FontPreviewContext);
  if (!ctx) {
    throw new Error("useFontPreview moet binnen een FontPreviewProvider gebruikt worden.");
  }
  return ctx;
}
