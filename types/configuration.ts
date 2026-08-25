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
  fontId: string | null;
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
  fontId: null,
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
  font: ProductFont;
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
  fontId: string;
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
  fontId: string;
  customText: string;
  extraLine1?: string;
  extraLine2?: string;
  numberPosition: "start" | "middle" | "end";
  hasFrame?: boolean;
}

export interface SendConfigurationEmailInput {
  configurationId: string;
}