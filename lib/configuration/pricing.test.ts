// Tests prijsberekening webshop (25-11-2026, verbouwing prijsstructuur).
// De bedragen per bord/kleur komen in het echt kant-en-klaar uit de
// beheertool; hier wordt getest dat de webshop ze exact optelt, nooit
// opnieuw afrondt, de juiste uitvoering/kleur gebruikt, en bij ontbrekende
// bedragen geen prijs geeft. Fictieve testbedragen.
import { describe, expect, it } from "vitest";
import {
  calculatePrice,
  colorSurchargeCentsFor,
  shapeHasPrice,
  totalCentsForQuantity,
} from "@/lib/configuration/pricing";
import { buildPriceLines, productPriceCents } from "@/lib/configuration/priceLines";
import { productSizes, globalPricingOptions } from "@/config/product-options";
import type { PricingData } from "@/lib/configuration/livePricing";
import type { ConfiguratorSelection } from "@/types/configuration";

const colorsB = { black: 625, white: 0, navy: 0, cream: 625, green: 925, red: 925 };
const sale = (board: number, colors: Record<string, number>) => ({
  boardCents: board,
  colorSurchargeCentsByColorId: colors,
});

function pricing(model: "vast" | "inkoop"): PricingData {
  return {
    productSizes: productSizes.map((s) => ({
      ...s,
      shippingCarrierName: "PostNL",
      shippingTierName: "Brievenbus",
      shippingCostCents: 495,
      sale:
        s.id === "nummer-105x105"
          ? { vlak: sale(6050, colorsB), gewelfd: sale(7300, { ...colorsB, black: 750, green: 1100 }) }
          : s.id === "ovaal-105x150"
            ? { vlak: null, gewelfd: sale(7300, colorsB) }
            : s.id === "oren-2-horizontaal-130x100"
              ? {
                  vlak: sale(5000, { "oren-zwart": 500, "oren-wit": 0, "oren-groen": 725 }),
                  gewelfd: null,
                }
              : null,
    })),
    globalPricingOptions: {
      ...globalPricingOptions,
      extraCharPriceCents: 250,
      frameSurchargeCents: 500,
      pricingModel: model,
      vatPct: 21,
    },
    priceListVersion: 34,
  };
}

const base: ConfiguratorSelection = {
  shapeId: "nummer",
  finish: "vlak",
  colorId: "black",
  printColorId: "white",
  earColorId: null,
  plateColorId: null,
  sizeId: "nummer-105x105",
  customText: "12",
  extraLine1: "",
  extraLine2: "",
  numberFontId: "bodoni",
  line1FontId: null,
  line2FontId: null,
  numberPosition: "start",
  hasFrame: false,
} as unknown as ConfiguratorSelection;

describe("nieuwe berekening (inkoop)", () => {
  it("11D facet, groep B: exacte som € 79,25 zonder nieuwe afronding", () => {
    // 2 extra karakters (4 tekens, max 2) × € 2,50 + kader € 5,00. Het
    // "speciaal teken" uit 11D bestaat niet in de webshop (besluit B3).
    const p = calculatePrice({ ...base, customText: "1234", hasFrame: true }, pricing("inkoop"))!;
    expect(p.basePriceCents).toBe(6050);
    expect(p.colorLines).toEqual([
      { role: "ondergrond", colorId: "black", cents: 625 },
      { role: "opdruk", colorId: "white", cents: 0 },
    ]);
    expect(p.extraCharsCents).toBe(500);
    expect(p.frameSurchargeCents).toBe(500);
    expect(productPriceCents(p)).toBe(6050 + 625 + 500 + 500);
    expect(p.totalCents).toBe(6050 + 625 + 500 + 500 + 495);
  });

  it("gewelfd, groep C + B: elke kleur telt apart (B2)", () => {
    const p = calculatePrice(
      { ...base, finish: "gewelfd", colorId: "green", printColorId: "black" },
      pricing("inkoop")
    )!;
    expect(p.basePriceCents).toBe(7300);
    expect(p.colorSurchargeCents).toBe(1100 + 750);
  });

  it("de bij een kleur getoonde meerprijs is exact de toegepaste meerprijs", () => {
    const pd = pricing("inkoop");
    for (const colorId of Object.keys(colorsB)) {
      const shown = colorSurchargeCentsFor(base, colorId, pd);
      const p = calculatePrice({ ...base, colorId, printColorId: colorId === "white" ? "navy" : "white" }, pd)!;
      expect(p.colorLines[0].cents).toBe(shown);
    }
  });

  it("wisselen van uitvoering/kleur geeft telkens de volledige nieuwe prijs (geen opstapeling)", () => {
    const pd = pricing("inkoop");
    const a = calculatePrice(base, pd)!.totalCents;
    calculatePrice({ ...base, finish: "gewelfd", colorId: "green" }, pd);
    calculatePrice({ ...base, colorId: "cream" }, pd);
    expect(calculatePrice(base, pd)!.totalCents).toBe(a);
  });

  it("ontbrekende bedragen → geen prijs (nooit € 0)", () => {
    const pd = pricing("inkoop");
    expect(calculatePrice({ ...base, sizeId: "nummer-105x120" }, pd)).toBeNull(); // geen sale
    expect(calculatePrice({ ...base, finish: null }, pd)).toBeNull(); // afwerking nog niet gekozen
    expect(
      calculatePrice({ ...base, shapeId: "ovaal", sizeId: "ovaal-105x150", finish: "vlak" }, pd)
    ).toBeNull(); // ovaal bestaat niet in facet
    const zonderKleurprijs = pricing("inkoop");
    const s = zonderKleurprijs.productSizes.find((x) => x.id === "nummer-105x105")!;
    s.sale = { vlak: sale(6050, { white: 0 }), gewelfd: null };
    expect(calculatePrice(base, zonderKleurprijs)).toBeNull(); // zwart heeft geen bedrag
  });

  it("oren-vormen gebruiken de facetkolom (B4)", () => {
    const p = calculatePrice(
      {
        ...base,
        shapeId: "oren-2-horizontaal",
        sizeId: "oren-2-horizontaal-130x100",
        finish: null,
        colorId: null,
        printColorId: null,
        plateColorId: "oren-groen",
        earColorId: "oren-zwart",
        customText: "12",
      },
      pricing("inkoop")
    )!;
    expect(p.finishForPrice).toBe("vlak");
    expect(p.basePriceCents).toBe(5000);
    expect(p.colorLines).toEqual([
      { role: "ondergrond", colorId: "oren-groen", cents: 725 },
      { role: "opdruk", colorId: "oren-zwart", cents: 500 },
    ]);
  });

  it("aantallen: bordprijs × aantal + verzending één keer", () => {
    const p = calculatePrice(base, pricing("inkoop"))!;
    expect(totalCentsForQuantity(p, 3)).toBe((6050 + 625) * 3 + 495);
  });

  it("prijsopbouw-regels tellen op tot de productprijs", () => {
    const p = calculatePrice({ ...base, customText: "1234", hasFrame: true }, pricing("inkoop"))!;
    const lines = buildPriceLines(p, false);
    expect(lines.map((l) => l.label)).toEqual([
      "Bord facet",
      "Kleur ondergrond: Zwart – RAL 9005",
      "Kleur opdruk: Wit – RAL 9016",
      "Extra karakters: 2 × €\u00a02,50", // Intl gebruikt een vaste spatie na €
      "Kader",
    ]);
    expect(lines.reduce((s, l) => s + l.cents, 0)).toBe(productPriceCents(p));
  });

  it("vorm zonder enkele prijs → 'Prijs op aanvraag' bij de vormkeuze", () => {
    expect(shapeHasPrice("nummer-1regel", pricing("inkoop"))).toBe(false);
    expect(shapeHasPrice("nummer", pricing("inkoop"))).toBe(true);
  });

  it("som van componenten blijft exact € 71,05", () => {
    expect(6050 + 625 + 235 + 195).toBe(7105);
  });
});

describe("oude berekening (vast) blijft werken", () => {
  it("vaste bordprijs + vaste kleurmeerprijs voor niet-standaardkleur", () => {
    const pd = pricing("vast");
    const p = calculatePrice({ ...base, colorId: "green", printColorId: "white" }, pd)!;
    expect(p.basePriceCents).toBe(2262);
    expect(p.colorSurchargeCents).toBe(globalPricingOptions.colorSurchargeCents);
    expect(colorSurchargeCentsFor(base, "black", pd)).toBe(0);
  });
});
