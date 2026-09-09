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
  // `colorId`: de ENE kleurkeuze voor vormen met colorMode "single" (de 4
  // oorspronkelijke vormen). Blijft voor die vormen ongewijzigd in gebruik.
  colorId: string | null;
  // `earColorId`/`plateColorId`: toegevoegd 9-9-2026 voor vormen met
  // colorMode "ears-and-plate" (de 3 nieuwe jaren-30-vormen met
  // bevestigingsogen, zie types/product.ts) — kleur van de "oren"
  // respectievelijk het vlak, allebei verplicht en allebei uit de aparte
  // lijst `productColorsOren` (config/product-options.ts), nooit uit
  // `productColors`.
  //
  // Per vorm is maar één van de twee kleurmodellen relevant:
  // - colorMode "single"          → alleen `colorId` gebruikt/verplicht;
  //   `earColorId`/`plateColorId` blijven null.
  // - colorMode "ears-and-plate"  → alleen `earColorId` + `plateColorId`
  //   gebruikt/verplicht; `colorId` blijft null.
  // Zie ConfiguratorContext.tsx (SET_SHAPE) voor het resetten van het
  // niet-relevante veld/de niet-relevante velden bij het wisselen van vorm,
  // en lib/validation/configuration.schema.ts voor de conditionele
  // verplichtstelling.
  earColorId: string | null;
  plateColorId: string | null;
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
  earColorId: null,
  plateColorId: null,
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
  // Zie de toelichting bij ConfiguratorSelection hierboven: voor
  // colorMode "ears-and-plate"-vormen blijft `colorId` ongebruikt/leeg en
  // zijn juist `earColorId`/`plateColorId` verplicht, en omgekeerd voor
  // colorMode "single"-vormen.
  colorId: string;
  earColorId: string | null;
  plateColorId: string | null;
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
  // BUGFIX 9-9-2026 (uitbreiding naar 7 vormen): `finish` stond hier nog als
  // verplicht-niet-null (PlateFinish), terwijl het voor colorMode
  // "ears-and-plate"-vormen (de 3 "oren"-vormen) legitiem `null` blijft —
  // die vormen kennen geen afwerkingskeuze (zie types/product.ts,
  // hasFinishChoice). `finish` is in lib/validation/configuration.schema.ts
  // (createConfigurationSchema) het ENIGE van deze "optionele" velden dat
  // met zods `.nullable()` is gedefinieerd — een letterlijke `null` wordt
  // daar dus geaccepteerd.
  finish: PlateFinish | null;
  // BUGFIX 9-9-2026: colorId/earColorId/plateColorId/numberFontId zijn in
  // createConfigurationSchema stuk voor stuk ALLEEN `.optional()` (zonder
  // `.nullable()`) — zod accepteert daar dus wel het weglaten van de key
  // (`undefined`), maar geeft een validatiefout ("Expected string, received
  // null") bij een letterlijke `null`-waarde. Deze velden hier daarom bewust
  // getypeerd als optioneel ZONDER `| null` (in plaats van het eerdere
  // `string | null`, dat een aanroeper zou uitnodigen om `null` te sturen en
  // zo alsnog een validatiefout te veroorzaken) — de aanroeper
  // (app/configurator/controle/page.tsx) laat een niet-toepasselijk veld dus
  // weg (`undefined`), nooit `null`. Zie ook ConfiguratorSelection
  // hierboven: dat interne state-type gebruikt `null` wél voor "nog niet
  // gekozen" — de vertaling naar `undefined` voor deze wire-payload gebeurt
  // in controle/page.tsx.
  colorId?: string;
  earColorId?: string;
  plateColorId?: string;
  sizeId: string;
  numberFontId?: string;
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