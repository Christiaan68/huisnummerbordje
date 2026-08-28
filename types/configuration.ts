import type { PlateFinish, ProductColor, ProductFont, ProductShape, ProductSize } from "./product";

export type ConfigurationStatus =
  | "draft"
  | "confirmed"
  | "paid"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type PaymentProvider = "mollie" | "stripe" | null;

export interface ConfiguratorSelection {
  shapeId: string | null;
  finish: PlateFinish | null;
  colorId: string | null;
  sizeId: string | null;
  // Elk tekstveld heeft sinds 28-8-2026 zijn eigen lettertype (op verzoek
  // van Christiaan: "elke tekst of nummer dat ik in moet typen, moet het
  // lettertype gewijzigd kunnen worden" — de losse stap "Lettertype" is
  // daarmee vervallen, zie lib/configuration/steps.ts). line1FontId/
  // line2FontId zijn alleen relevant als de gekozen vorm die tekstregel
  // ook echt heeft (shape.extraLines, zie config/product-options.ts).
  numberFontId: string | null;
  line1FontId: string | null;
  line2FontId: string | null;
  customText: string;
  extraLine1: string;
  extraLine2: string;
  numberPosition: "start" | "middle" | "end";
  // Optionele sierrand ("kader") rond het bordje — toegevoegd 25-8-2026.
  // Alleen beschikbaar voor niet-ovale vormen; wordt bij het kiezen van
  // "ovaal" automatisch teruggezet naar false (zie ConfiguratorContext.tsx).
  hasFrame: boolean;
}

export const emptyConfiguratorSelection: ConfiguratorSelection = {
  shapeId: null,
  finish: null,
  colorId: null,
  sizeId: null,
  numberFontId: null,
  line1FontId: null,
  line2FontId: null,
  customText: "",
  extraLine1: "",
  extraLine2: "",
  numberPosition: "start",
  hasFrame: false,
};

export interface ConfiguratorSelectionResolved {
  shape: ProductShape;
  finish: PlateFinish;
  color: ProductColor;
  size: ProductSize;
  numberFont: ProductFont;
  line1Font: ProductFont | null;
  line2Font: ProductFont | null;
  customText: string;
  extraLine1: string;
  extraLine2: string;
}

export interface Configuration {
  id: string;
  shapeId: string;
  finish: PlateFinish;
  colorId: string;
  sizeId: string;
  numberFontId: string;
  line1FontId: string | null;
  line2FontId: string | null;
  customText: string;
  extraLine1: string | null;
  extraLine2: string | null;
  status: ConfigurationStatus;
  priceCents: number | null;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfigurationInput {
  shapeId: string;
  finish: PlateFinish;
  colorId: string;
  sizeId: string;
  numberFontId: string;
  line1FontId?: string;
  line2FontId?: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  numberPosition: "start" | "middle" | "end";
  hasFrame?: boolean;
}

export interface SendConfigurationEmailInput {
  configurationId: string;
}