"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PricingData } from "@/lib/configuration/livePricing";

const PricingDataContext = createContext<PricingData | null>(null);

/**
 * Geeft de (live opgehaalde, of anders reservekopie-) prijsgegevens door aan
 * alle configurator-onderdelen die een prijs moeten tonen of berekenen. De
 * daadwerkelijke gegevens worden ÉÉN keer opgehaald in
 * app/configurator/layout.tsx (server-side, bij het laden van de
 * configurator) en hier alleen doorgegeven — dat voorkomt dat elk onderdeel
 * zijn eigen, aparte aanvraag naar de prijstool zou moeten doen.
 */
export function PricingDataProvider({
  data,
  children,
}: {
  data: PricingData;
  children: ReactNode;
}) {
  return (
    <PricingDataContext.Provider value={data}>
      {children}
    </PricingDataContext.Provider>
  );
}

export function usePricingData(): PricingData {
  const context = useContext(PricingDataContext);
  if (!context) {
    throw new Error(
      "usePricingData moet gebruikt worden binnen een PricingDataProvider"
    );
  }
  return context;
}
