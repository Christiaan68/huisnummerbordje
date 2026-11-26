"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Teksten uit de beheertool die in de configurator getoond worden
 * (toegevoegd 26-11-2026): de verwachte levertijd — exact dezelfde zin als
 * in de bevestigingsmail en op de bedankpagina (lib/shop-texts.ts,
 * getExpectedDeliveryText). Wordt server-side opgehaald in
 * app/configurator/layout.tsx.
 */
interface ShopTexts {
  expectedDeliveryText: string | null;
}

const ShopTextsContext = createContext<ShopTexts>({ expectedDeliveryText: null });

export function ShopTextsProvider({
  expectedDeliveryText,
  children,
}: {
  expectedDeliveryText: string | null;
  children: ReactNode;
}) {
  return (
    <ShopTextsContext.Provider value={{ expectedDeliveryText }}>
      {children}
    </ShopTextsContext.Provider>
  );
}

export function useShopTexts(): ShopTexts {
  return useContext(ShopTextsContext);
}
