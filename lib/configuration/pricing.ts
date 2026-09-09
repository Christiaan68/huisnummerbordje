import type { ConfiguratorSelection } from "@/types/configuration";
import type { PricingData } from "@/lib/configuration/livePricing";
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
export interface PriceBreakdown {
  basePriceCents: number;
  colorSurchargeCents: number;
  extraCharsCount: number;
  extraCharsCents: number;
  frameSurchargeCents: number;
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
  const basePriceCents = earsShape
    ? size.priceFlatCents ?? size.priceCurvedCents
    : selection.finish
      ? selection.finish === "vlak"
        ? size.priceFlatCents
        : size.priceCurvedCents
      : null;

  // Nog geen basisprijs bekend (afwerking nog niet gekozen bij de
  // bestaande vormen, óf — bij de "oren"-vormen — Christiaan heeft de
  // basisprijs van dit product nog niet ingevuld in de prijsbeheeromgeving)
  // → hetzelfde "prijs op aanvraag"-pad dat nu ook al bestaat voor bv.
  // "ovaal" zonder vlakke prijs: gewoon nog geen prijs tonen.
  if (basePriceCents === null || basePriceCents === undefined) return null;

  let colorSurchargeCents: number;
  if (earsShape) {
    // "Oren"-vormen: 2 losse, verplichte kleuren (oren + vlak), uit de
    // aparte lijst productColorsOren (config/product-options.ts) — de
    // meerprijs geldt PER kleur die geen standaardkleur is (dus 0x, 1x of 2x
    // colorSurchargeCents), tegen `orenStandardColorIds` in plaats van
    // `standardColorIds`. Nog geen keuze gemaakt voor een kleurveld? Dan telt
    // dat veld (nog) niet mee als meerprijskleur (zelfde aanpak als bij de
    // bestaande, enkelvoudige kleurkeuze hieronder: geen kleur getoond, dus
    // ook geen meerprijs getoond, die verschijnt vanzelf zodra er gekozen
    // is).
    const earIsSurcharge = Boolean(
      selection.earColorId &&
        !globalPricingOptions.orenStandardColorIds.includes(selection.earColorId)
    );
    const plateIsSurcharge = Boolean(
      selection.plateColorId &&
        !globalPricingOptions.orenStandardColorIds.includes(selection.plateColorId)
    );
    colorSurchargeCents =
      (earIsSurcharge ? globalPricingOptions.colorSurchargeCents : 0) +
      (plateIsSurcharge ? globalPricingOptions.colorSurchargeCents : 0);
  } else {
    // Bestaande vormen (colorMode "single") — ongewijzigd gedrag. Nog geen
    // kleur gekozen? Dan nog geen meerprijs tonen (die komt vanzelf zodra de
    // klant een kleur kiest).
    const isStandardColor = selection.colorId
      ? globalPricingOptions.standardColorIds.includes(selection.colorId)
      : true;
    colorSurchargeCents = isStandardColor ? 0 : globalPricingOptions.colorSurchargeCents;
  }

  const extraCharsCount = Math.max(
    0,
    selection.customText.length - size.defaultMaxChars
  );
  const extraCharsCents = extraCharsCount * globalPricingOptions.extraCharPriceCents;

  // Kaderrand: bestaat niet voor "oren"-vormen (hasFrameChoice: false) —
  // ConfiguratorContext.tsx (SET_SHAPE) zet `hasFrame` bij het ingaan van
  // zo'n vorm terug naar `false`, dus dit blijft voor die vormen vanzelf 0
  // zonder dat hier een aparte uitzondering nodig is.
  const frameSurchargeCents = selection.hasFrame
    ? globalPricingOptions.frameSurchargeCents
    : 0;

  const totalCents =
    basePriceCents + colorSurchargeCents + extraCharsCents + frameSurchargeCents;

  return {
    basePriceCents,
    colorSurchargeCents,
    extraCharsCount,
    extraCharsCents,
    frameSurchargeCents,
    totalCents,
  };
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
