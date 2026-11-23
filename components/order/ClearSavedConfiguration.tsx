"use client";

import { useEffect } from "react";
import { CONFIGURATOR_STORAGE_KEY } from "@/lib/configuration/ConfiguratorContext";

/**
 * B1 (testrapport 22-11-2026): na een geslaagde betaling de in de browser
 * bewaarde configurator-keuzes wissen, zodat een volgende bestelling weer
 * leeg begint.
 */
export function ClearSavedConfiguration() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(CONFIGURATOR_STORAGE_KEY);
    } catch {
      // Opslag niet beschikbaar: niets te wissen.
    }
  }, []);
  return null;
}
