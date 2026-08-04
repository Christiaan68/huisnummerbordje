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
  /** Het huisnummer zelf, max. 2 tekens. */
  customText: string;
  /** Extra tekstregel 1, max. 20 tekens. Alleen relevant als de gekozen vorm dit ondersteunt. */
  extraLine1: string;
  /** Extra tekstregel 2, max. 20 tekens. Alleen relevant als de gekozen vorm dit ondersteunt. */
  extraLine2: string;
  /** Tekengrootte van het huisnummer, in mm (intypbaar, binnen de range van de gekozen vorm). */
  numberSizeMm: number | null;
  /** Tekengrootte van tekstregel 1, in mm. */
  line1SizeMm: number | null;
  /** Tekengrootte van tekstregel 2, in mm. */
  line2SizeMm: number | null;
  /** Positie van het huisnummer t.o.v. de tekstregel(s) op het bordje. */
  numberPosition: "start" | "middle" | "end";
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
  numberSizeMm: null,
  line1SizeMm: null,
  line2SizeMm: null,
  numberPosition: "start",
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
  numberSizeMm: number;
  line1SizeMm?: number;
  line2SizeMm?: number;
}

export interface SendConfigurationEmailInput {
  configurationId: string;
}