"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Deelt de "Verder"/"Configuratie bevestigen"-knop van de HUIDIGE
 * configuratorstap met ProgressIndicator.tsx, zodat diezelfde knop niet
 * alleen onderaan (zie ConfiguratorNav.tsx en app/configurator/controle/
 * page.tsx), maar ook bovenaan, rechts uitgelijnd naast de stap-tabjes
 * ("Vorm"/"Afwerking"/"Kleur" enz.) getoond kan worden — op verzoek van
 * Christiaan, 15-9-2026.
 *
 * Elke stappagina "meldt" zijn eigen knop hier aan (via useEffect, zie
 * ConfiguratorNav.tsx en de "controle"-pagina) en haalt 'm weer weg zodra
 * die pagina verlaten wordt — zo hoeft ProgressIndicator.tsx zelf niets te
 * weten over de specifieke stap-logica (welke stap compleet is, welke actie
 * de knop moet uitvoeren, enz.), dat blijft bij de stappen zelf.
 */
export interface TopBarAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface TopBarActionContextValue {
  action: TopBarAction | null;
  setAction: (action: TopBarAction | null) => void;
}

const TopBarActionContext = createContext<TopBarActionContextValue | undefined>(
  undefined
);

export function TopBarActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<TopBarAction | null>(null);
  return (
    <TopBarActionContext.Provider value={{ action, setAction }}>
      {children}
    </TopBarActionContext.Provider>
  );
}

export function useTopBarAction() {
  const context = useContext(TopBarActionContext);
  if (!context) {
    throw new Error("useTopBarAction moet binnen een TopBarActionProvider gebruikt worden.");
  }
  return context;
}
