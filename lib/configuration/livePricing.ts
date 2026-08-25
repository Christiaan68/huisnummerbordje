import {
  productSizes as staticProductSizes,
  globalPricingOptions as staticGlobalPricingOptions,
} from "@/config/product-options";
import type { ProductSize } from "@/types/product";

/**
 * Koppelt de product-ID's van de prijsbeheeromgeving (bijvoorbeeld "1105105")
 * aan de product-ID's van deze webshop (bijvoorbeeld "nummer-105x105"). Deze
 * twee systemen gebruiken andere ID's voor hetzelfde product; deze
 * koppeltabel is op 15-8-2026 met de hand opgesteld op basis van de
 * afmetingen/vorm van elk product.
 *
 * LET OP voor een volgende wijziging: als er ooit een NIEUW product wordt
 * toegevoegd in de prijsbeheeromgeving, moet hier een regel bij komen —
 * anders wordt de prijs van dat nieuwe product niet automatisch opgehaald
 * (de webshop laat het gewoon weg / gebruikt de reservekopie-waarde als die
 * er is, maar synchroniseert niet vanzelf een compleet nieuw product).
 */
const PRIJSTOOL_ID_NAAR_WEBSHOP_ID: Record<string, string> = {
  "1105105": "nummer-105x105",
  "1105120": "nummer-105x120",
  "1105148": "nummer-105x148",
  "1105210": "nummer-105x210",
  "1148148": "nummer-148x148",
  "1148210": "nummer-148x210",
  "1210210": "nummer-210x210",
  "11210297": "nummer-210x297",
  "2148148": "1regel-148x148",
  "2148210": "1regel-148x210",
  "2210210": "1regel-210x210",
  "2210297": "1regel-210x297",
  "2250200": "1regel-250x200",
  "3148148": "2regels-148x148",
  "3148210": "2regels-148x210",
  "3210210": "2regels-210x210",
  "3210297": "2regels-210x297",
  "3250200": "2regels-250x200",
  "4105150": "ovaal-105x150",
  "4125175": "ovaal-125x175",
  "4143183": "ovaal-143x183",
  "4160210": "ovaal-160x210",
  "4220300": "ovaal-220x300",
};

export interface PricingData {
  productSizes: ProductSize[];
  globalPricingOptions: typeof staticGlobalPricingOptions;
}

export interface LivePricingData extends PricingData {
  // "prijstool" = live opgehaald bij de online prijsbeheeromgeving.
  // "reservekopie" = de vaste waarden uit config/product-options.ts, omdat
  // het live ophalen niet lukte (of niet is ingesteld).
  bron: "prijstool" | "reservekopie";
}

interface PrijstoolProduct {
  id: string;
  basePriceVlak: number;
  basePriceGewelfd: number;
  defaultMaxChars: number;
}

interface PrijstoolResponse {
  products: PrijstoolProduct[];
  globalOptions: {
    extraCharPrice: number;
    colorPrice: number;
    // Meerprijs kaderrand — hergebruikt het bestaande "specialCharPrice"
    // ("Meerprijs speciale tekens") van de prijstool, zie de toelichting bij
    // globalPricingOptions in config/product-options.ts.
    specialCharPrice: number;
  };
}

function isValidPrijstoolResponse(data: unknown): data is PrijstoolResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.products)) return false;
  if (!d.globalOptions || typeof d.globalOptions !== "object") return false;
  const go = d.globalOptions as Record<string, unknown>;
  if (typeof go.extraCharPrice !== "number") return false;
  if (typeof go.colorPrice !== "number") return false;
  if (typeof go.specialCharPrice !== "number") return false;
  return true;
}

function reservekopie(): LivePricingData {
  return {
    productSizes: staticProductSizes,
    globalPricingOptions: staticGlobalPricingOptions,
    bron: "reservekopie",
  };
}

/**
 * Haalt de actuele prijzen op bij de online prijsbeheeromgeving
 * (huisnummerbordjes-prijsbeheer-web). Wordt aangeroepen bij elk bezoek aan
 * de configurator en bij elke bestelling (server-side, dus nooit door de
 * klant te beïnvloeden).
 *
 * Lukt het ophalen niet (prijstool onbereikbaar, te traag, verkeerde
 * instellingen, of onverwachte gegevens), dan valt deze functie ALTIJD
 * terug op de vaste reservekopie uit config/product-options.ts — de webshop
 * blijft dus altijd werken en toont nooit een kapotte pagina aan een klant,
 * ook niet als de prijstool er even uit ligt.
 */
export async function getLivePricingData(): Promise<LivePricingData> {
  const baseUrl = process.env.PRIJSTOOL_API_URL;
  const apiKey = process.env.PRIJSTOOL_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn(
      "PRIJSTOOL_API_URL of PRIJSTOOL_API_KEY ontbreekt in de environment variables — " +
        "de webshop gebruikt de vaste reservekopie van de prijzen."
    );
    return reservekopie();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/prices`, {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      console.error(
        `Prijstool gaf status ${res.status} terug bij het ophalen van de prijzen — ` +
          "de webshop gebruikt de vaste reservekopie van de prijzen."
      );
      return reservekopie();
    }

    const data: unknown = await res.json();
    if (!isValidPrijstoolResponse(data)) {
      console.error(
        "Prijstool gaf onverwachte gegevens terug — " +
          "de webshop gebruikt de vaste reservekopie van de prijzen."
      );
      return reservekopie();
    }

    const prijzenPerWebshopId = new Map<string, PrijstoolProduct>();
    for (const product of data.products) {
      const webshopId = PRIJSTOOL_ID_NAAR_WEBSHOP_ID[product.id];
      if (webshopId) prijzenPerWebshopId.set(webshopId, product);
    }

    const mergedProductSizes: ProductSize[] = staticProductSizes.map((size) => {
      const live = prijzenPerWebshopId.get(size.id);
      if (!live) return size;
      return {
        ...size,
        // In de prijstool betekent basePriceVlak = 0 "niet van toepassing"
        // (bijvoorbeeld bij ovale vormen, die alleen gewelfd bestaan) —
        // dat vertalen we hier naar `null`, net als in de reservekopie.
        priceFlatCents:
          live.basePriceVlak === 0 ? null : Math.round(live.basePriceVlak * 100),
        priceCurvedCents: Math.round(live.basePriceGewelfd * 100),
        defaultMaxChars: live.defaultMaxChars,
      };
    });

    return {
      productSizes: mergedProductSizes,
      globalPricingOptions: {
        ...staticGlobalPricingOptions,
        extraCharPriceCents: Math.round(data.globalOptions.extraCharPrice * 100),
        colorSurchargeCents: Math.round(data.globalOptions.colorPrice * 100),
        frameSurchargeCents: Math.round(data.globalOptions.specialCharPrice * 100),
      },
      bron: "prijstool",
    };
  } catch (err) {
    console.error(
      "Kon de actuele prijzen niet ophalen bij de prijstool — " +
        "de webshop gebruikt de vaste reservekopie van de prijzen.",
      err instanceof Error ? err.message : err
    );
    return reservekopie();
  }
}
