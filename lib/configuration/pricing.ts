import type { ConfiguratorSelection } from "@/types/configuration";
import type { PricingData, PricingModel } from "@/lib/configuration/livePricing";
import type { ProductSize, PlateFinish, SaleFinishPrices } from "@/types/product";
import { productShapes } from "@/config/product-options";
import { isEarsShape } from "@/lib/configuration/shape-helpers";

/**
 * Berekent de actuele prijs voor de huidige configuratorkeuzes.
 *
 * De prijsgegevens (`pricingData`) komen NIET meer statisch uit dit bestand
 * of uit config/product-options.ts, maar worden meegegeven door de
 * aanroeper — normaal gesproken de live opgehaalde prijzen uit de
 * prijsbeheeromgeving (zie lib/configuration/livePricing.ts), met een
 * automatische terugval op de vaste reservekopie als het live ophalen niet
 * lukt. Dat gebeurt hier niet meer — deze functie is een pure rekenfunctie.
 * `productShapes` zelf (vorm-metadata zoals colorMode) verandert niet via de
 * prijstool en wordt daarom, net als op andere plekken in de configurator
 * (bv. ConfiguratorContext.tsx), rechtstreeks uit config/product-options.ts
 * gehaald.
 *
 * Nog niet meegenomen in deze berekening:
 * - de meerprijs voor extra karakters geldt alleen voor het huisnummer
 *   zelf, niet voor de optionele extra tekstregels (zo besloten door
 *   Christiaan op 2026-08-15).
 */
// Eén kleurregel in de prijsopbouw (25-11-2026): elke gekozen kleur heeft
// een eigen meerprijs (besluit B2). "ondergrond" = Ondergrond kleur (bij de
// oren-vormen: plateColorId), "opdruk" = Opdruk kleur (bij de oren-vormen:
// earColorId) — zelfde benaming als in de kleurkeuze.
export interface ColorPriceLine {
  role: "ondergrond" | "opdruk";
  colorId: string;
  cents: number;
}

export interface PriceBreakdown {
  pricingModel: PricingModel;
  // Bordprijs incl. btw (bij "inkoop": afgerond op € 0,50 door de beheertool).
  basePriceCents: number;
  // Afwerking waarop de bordprijs gebaseerd is ("vlak" ook voor de
  // oren-vormen, die alleen de facetkolom gebruiken — besluit B4).
  finishForPrice: PlateFinish;
  // Per gekozen kleur de meerprijs; colorSurchargeCents is het totaal.
  colorLines: ColorPriceLine[];
  colorSurchargeCents: number;
  // Meerprijs per extra karakter (incl. btw), voor "n × € x" in de opbouw.
  extraCharUnitCents: number;
  extraCharsCount: number;
  extraCharsCents: number;
  frameSurchargeCents: number;
  // Leveringskosten (toegevoegd 17-9-2026) — volledig bepaald door de
  // prijsbeheeromgeving op basis van het gekozen product/maat, de klant
  // kiest zelf geen vervoerder of verzendstaffel. shippingCostCents is
  // altijd een concreet getal in een teruggegeven PriceBreakdown: is er
  // (nog) geen geldige koppeling, dan geeft calculatePrice() hieronder
  // `null` voor de HELE prijs terug (zie de toelichting daar) in plaats van
  // een PriceBreakdown met een gok-waarde — er wordt dus nooit stilzwijgend
  // 0/gratis verzending getoond of doorberekend.
  shippingCarrierName: string | null;
  shippingTierName: string | null;
  shippingCostCents: number;
  totalCents: number;
}

export function calculatePrice(
  selection: ConfiguratorSelection,
  pricingData: PricingData
): PriceBreakdown | null {
  const { productSizes, globalPricingOptions } = pricingData;

  const size = productSizes.find((s) => s.id === selection.sizeId);
  if (!size) return null;

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const earsShape = isEarsShape(shape);

  // Basisprijs: de 4 oorspronkelijke vormen (hasFinishChoice: true) hebben
  // een aparte prijs per afwerking (vlak/gewelfd) — zonder gekozen afwerking
  // is er dus nog geen prijs te tonen, exact het bestaande gedrag.
  //
  // De 3 "oren"-vormen (hasFinishChoice: false, toegevoegd 9-9-2026) kennen
  // geen vlak/gewelfd-onderscheid — `selection.finish` is voor hen altijd
  // `null` (zie ConfiguratorContext.tsx). Omdat in de prijsbeheeromgeving
  // straks niet vastligt in wélk van de twee prijsvelden Christiaan de
  // (enige) basisprijs van zo'n product invult, wordt hier bewust het eerst
  // ingevulde van de twee gebruikt (`priceFlatCents ?? priceCurvedCents`) —
  // zodat dit werkt ongeacht welk veld hij straks gebruikt.
  // Afwerking waarop de prijs gebaseerd is: de oren-vormen hebben geen
  // facet/gewelfd-keuze en gebruiken de facetkolom (besluit B4, 25-11-2026).
  const finishForPrice: PlateFinish | null = earsShape ? "vlak" : selection.finish;

  // De gekozen kleuren, elk met een eigen meerprijs (besluit B2).
  const chosenColors: { role: ColorPriceLine["role"]; colorId: string }[] = [];
  if (earsShape) {
    if (selection.plateColorId) chosenColors.push({ role: "ondergrond", colorId: selection.plateColorId });
    if (selection.earColorId) chosenColors.push({ role: "opdruk", colorId: selection.earColorId });
  } else {
    if (selection.colorId) chosenColors.push({ role: "ondergrond", colorId: selection.colorId });
    if (selection.printColorId) chosenColors.push({ role: "opdruk", colorId: selection.printColorId });
  }

  let basePriceCents: number | null | undefined;
  let colorLines: ColorPriceLine[];
  const pricingModel = globalPricingOptions.pricingModel ?? "vast";

  if (pricingModel === "inkoop") {
    // NIEUWE BEREKENING (25-11-2026): bordprijs en kleurmeerprijs komen
    // kant-en-klaar (afgerond, incl. btw) uit de beheertool — hier wordt
    // alleen opgeteld, nooit opnieuw afgerond. Ontbreekt een bedrag, dan is
    // er geen prijs ("Prijs op aanvraag"), nooit stilzwijgend € 0.
    const sale = finishForPrice ? size.sale?.[finishForPrice] ?? null : null;
    if (!sale) return null;
    basePriceCents = sale.boardCents;
    colorLines = [];
    for (const c of chosenColors) {
      const cents = sale.colorSurchargeCentsByColorId[c.colorId];
      if (cents === undefined || cents === null) return null;
      colorLines.push({ ...c, cents });
    }
  } else {
    // OUDE BEREKENING (ongewijzigd): vaste bordprijs per afwerking.
    // De 4 oorspronkelijke vormen hebben een aparte prijs per afwerking
    // (vlak/gewelfd) — zonder gekozen afwerking nog geen prijs. De 3
    // "oren"-vormen kennen geen vlak/gewelfd-onderscheid: het eerst
    // ingevulde (> 0) van de twee prijsvelden wordt gebruikt.
    basePriceCents = earsShape
      ? size.priceFlatCents && size.priceFlatCents > 0
        ? size.priceFlatCents
        : size.priceCurvedCents
      : selection.finish
        ? selection.finish === "vlak"
          ? size.priceFlatCents
          : size.priceCurvedCents
        : null;
    // Vaste meerprijs per gekozen kleur die geen standaardkleur is.
    const standardIds = earsShape
      ? globalPricingOptions.orenStandardColorIds
      : globalPricingOptions.standardColorIds;
    colorLines = chosenColors.map((c) => ({
      ...c,
      cents: standardIds.includes(c.colorId) ? 0 : globalPricingOptions.colorSurchargeCents,
    }));
  }

  // Een basisprijs van 0 (of lager) of een onbekende basisprijs betekent
  // "Prijs op aanvraag" (besluit 8-10-2026) — nooit een bordje van € 0.
  // Meerprijzen van opties (extra tekens, kleur, kader) mogen wel 0 zijn.
  if (
    basePriceCents === null ||
    basePriceCents === undefined ||
    basePriceCents <= 0 ||
    !finishForPrice
  ) {
    return null;
  }

  const colorSurchargeCents = colorLines.reduce((sum, l) => sum + l.cents, 0);

  // C4 (testrapport 22-11-2026): alleen letters en cijfers tellen mee, zodat
  // de prijs niet verandert door tekens die toch niet toegestaan zijn.
  const extraCharsCount = Math.max(
    0,
    selection.customText.replace(/[^0-9A-Za-z]/g, "").length - size.defaultMaxChars
  );
  const extraCharsCents = extraCharsCount * globalPricingOptions.extraCharPriceCents;

  // Kaderrand: bestaat niet voor "oren"-vormen (hasFrameChoice: false) —
  // ConfiguratorContext.tsx (SET_SHAPE) zet `hasFrame` bij het ingaan van
  // zo'n vorm terug naar `false`, dus dit blijft voor die vormen vanzelf 0
  // zonder dat hier een aparte uitzondering nodig is.
  const frameSurchargeCents = selection.hasFrame
    ? globalPricingOptions.frameSurchargeCents
    : 0;

  // Leveringskosten (toegevoegd 17-9-2026): net als bij een nog ontbrekende
  // basisprijs hierboven (regel "if (basePriceCents === null...) return
  // null") geldt hier hetzelfde "prijs op aanvraag"-pad — is er voor dit
  // product/deze maat geen (geldige) vervoerder/verzendstaffel gekoppeld in
  // de prijsbeheeromgeving, dan is de totaalprijs nog niet bekend en wordt
  // er hier bewust GEEN PriceBreakdown teruggegeven (dus ook geen checkout
  // mogelijk, zie app/api/create-payment/route.ts). Zo kan een ontbrekende
  // koppeling nooit stilzwijgend tot gratis verzending leiden — zie het
  // verzoek van Christiaan bij het toevoegen van deze functionaliteit.
  if (size.shippingCostCents === null || size.shippingCostCents === undefined) {
    return null;
  }
  const shippingCostCents = size.shippingCostCents;

  const totalCents =
    basePriceCents +
    colorSurchargeCents +
    extraCharsCents +
    frameSurchargeCents +
    shippingCostCents;

  return {
    pricingModel,
    basePriceCents,
    finishForPrice,
    colorLines,
    colorSurchargeCents,
    extraCharUnitCents: globalPricingOptions.extraCharPriceCents,
    extraCharsCount,
    extraCharsCents,
    frameSurchargeCents,
    shippingCarrierName: size.shippingCarrierName ?? null,
    shippingTierName: size.shippingTierName ?? null,
    shippingCostCents,
    totalCents,
  };
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Aantal bordjes per bestelling (testrapport 22-11-2026, besluit A1, optie b):
 * de klant mag 1 tot en met MAX_QUANTITY stuks bestellen. De bordprijs
 * (basisprijs + meerprijzen) telt per stuk; de verzendkosten tellen één keer
 * per bestelling.
 */
export const MAX_QUANTITY = 10;

export function totalCentsForQuantity(price: PriceBreakdown, quantity: number): number {
  const q = Math.min(Math.max(Math.floor(quantity) || 1, 1), MAX_QUANTITY);
  return (price.totalCents - price.shippingCostCents) * q + price.shippingCostCents;
}

/**
 * Besluit A3 (testrapport 22-11-2026): heeft een vorm geen enkele maat met
 * een bekende prijs, dan toont de configurator al bij de vormkeuze
 * "Prijs op aanvraag". Zelfde regels als calculatePrice(): basisprijs > 0
 * (vlak of gewelfd) én gekoppelde verzendkosten.
 */
export function shapeHasPrice(shapeId: string, pricingData: PricingData): boolean {
  const inkoop = pricingData.globalPricingOptions.pricingModel === "inkoop";
  return pricingData.productSizes.some(
    (s) =>
      s.shapeId === shapeId &&
      (inkoop
        ? Boolean(s.sale?.vlak || s.sale?.gewelfd)
        : (s.priceFlatCents ?? 0) > 0 || (s.priceCurvedCents ?? 0) > 0) &&
      s.shippingCostCents !== null &&
      s.shippingCostCents !== undefined
  );
}

/**
 * Bordprijs (incl. btw) van één maat voor één afwerking, voor de weergave bij
 * de maatkeuze (25-11-2026). null = geen prijs bekend.
 */
export function boardPriceCentsFor(
  size: ProductSize,
  finish: PlateFinish,
  pricingData: PricingData
): number | null {
  if (pricingData.globalPricingOptions.pricingModel === "inkoop") {
    return size.sale?.[finish]?.boardCents ?? null;
  }
  const cents = finish === "vlak" ? size.priceFlatCents : size.priceCurvedCents;
  return cents && cents > 0 ? cents : null;
}

/**
 * Meerprijs (incl. btw) van één kleur voor de huidige keuze van vorm, maat
 * en afwerking — voor de weergave bij de kleurkeuze, vóór het kiezen
 * (25-11-2026). Exact hetzelfde bedrag als calculatePrice() daarna toepast.
 * null = (nog) niet te bepalen (maat of afwerking nog niet gekozen, of geen
 * prijs bekend).
 */
export function colorSurchargeCentsFor(
  selection: ConfiguratorSelection,
  colorId: string,
  pricingData: PricingData
): number | null {
  const { globalPricingOptions } = pricingData;
  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const earsShape = isEarsShape(shape);
  if (globalPricingOptions.pricingModel === "inkoop") {
    const size = pricingData.productSizes.find((s) => s.id === selection.sizeId);
    const finish: PlateFinish | null = earsShape ? "vlak" : selection.finish;
    const sale: SaleFinishPrices | null | undefined = size && finish ? size.sale?.[finish] : null;
    const cents = sale?.colorSurchargeCentsByColorId[colorId];
    return cents === undefined || cents === null ? null : cents;
  }
  const standardIds = earsShape
    ? globalPricingOptions.orenStandardColorIds
    : globalPricingOptions.standardColorIds;
  return standardIds.includes(colorId) ? 0 : globalPricingOptions.colorSurchargeCents;
}
