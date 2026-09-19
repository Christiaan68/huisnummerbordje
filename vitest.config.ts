import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Testinstellingen (toegevoegd 19-9-2026, samen met "Order handmatig
 * bevestigen"). De alias hieronder ("@/*" -> projectroot) is dezelfde als in
 * tsconfig.json, zodat testbestanden dezelfde `@/...`-imports kunnen
 * gebruiken als de rest van de code.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
