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
    // Vormen met colorMode "single" — sinds 16-9-2026 (op verzoek van
    // Christiaan) TWEE losse kleurkeuzes ("Ondergrond kleur" = colorId,
    // "Opdruk kleur" = printColorId) i.p.v. één — exact dezelfde opzet als
    // de "oren"-vormen hierboven: de meerprijs geldt PER kleur die geen
    // standaardkleur is (dus 0x, 1x of 2x colorSurchargeCents), tegen
    // dezelfde `standardColorIds` voor beide (colorId en printColorId komen
    // immers uit dezelfde lijst, productColors). Nog geen keuze gemaakt voor
    // een kleurveld? Dan telt dat veld (nog) niet mee als meerprijskleur
    // (die verschijnt vanzelf zodra de klant een kleur kiest).
    const baseIsSurcharge = Boolean(
      selection.colorId && !globalPricingOptions.standardColorIds.includes(selection.colorId)
    );
    const printIsSurcharge = Boolean(
      selection.printColorId &&
        !globalPricingOptions.standardColorIds.includes(selection.printColorId)
    );
    colorSurchargeCents =
      (baseIsSurcharge ? globalPricingOptions.colorSurchargeCents : 0) +
      (printIsSurcharge ? globalPricingOptions.colorSurchargeCents : 0);
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
    basePriceCents,
    colorSurchargeCents,
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
