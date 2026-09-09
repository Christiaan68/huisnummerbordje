import { z } from "zod";
import {
  houseNumberSchema,
  houseNumberEarsSchema,
  extraLineSchema,
} from "./text-input.schema";
import { productShapes } from "@/config/product-options";
import { isEarsShape } from "@/lib/configuration/shape-helpers";

/**
 * Validatie voor een complete configuratie, vóór opslag/bestellen.
 *
 * Sinds 9-9-2026 (uitbreiding naar 7 vormen) is deze validatie conditioneel
 * op de gekozen vorm: de 4 oorspronkelijke vormen (colorMode "single")
 * gebruiken de tak hieronder gemarkeerd "bestaande vormen" — die tak is
 * functioneel ONGEWIJZIGD (zelfde velden verplicht, zelfde
 * foutmeldingen/paths) t.o.v. vóór deze uitbreiding, alleen verplaatst van
 * top-level veldschema's naar de superRefine hieronder zodat dezelfde
 * velden voor de 3 nieuwe "oren"-vormen (colorMode "ears-and-plate") NIET
 * verplicht zijn. Zie types/product.ts (capability-vlaggen) en
 * lib/configuration/shape-helpers.ts (isEarsShape).
 */
export const createConfigurationSchema = z
  .object({
    shapeId: z.string().min(1, "Kies een vorm."),
    // Alleen relevant voor colorMode "single"-vormen (zie superRefine
    // hieronder) — daarom hier optioneel/nullable gemaakt (was voorheen een
    // verplicht z.enum). errorMap blijft dezelfde boodschap geven als
    // vroeger zodra er wél een (foutieve) waarde is opgegeven; het geval
    // "helemaal niet opgegeven" wordt nu in de superRefine afgehandeld (met
    // dezelfde boodschap), zodat vormen zonder afwerkingsbegrip hier niets
    // hoeven in te vullen.
    finish: z
      .enum(["vlak", "gewelfd"], {
        errorMap: () => ({ message: "Kies een afwerking." }),
      })
      .nullable()
      .optional(),
    // colorId (colorMode "single") vs. earColorId/plateColorId (colorMode
    // "ears-and-plate") — welke daadwerkelijk verplicht zijn hangt af van de
    // gekozen vorm en wordt hieronder in de superRefine afgedwongen. Zie de
    // toelichting in types/configuration.ts.
    colorId: z.string().optional().default(""),
    earColorId: z.string().optional().default(""),
    plateColorId: z.string().optional().default(""),
    // Bij "ears-and-plate"-vormen kiest de klant geen maat (er is er maar 1,
    // automatisch gezet door ConfiguratorContext) — verplichtstelling van
    // dit veld gebeurt daarom hieronder alleen nog voor de bestaande vormen.
    sizeId: z.string().optional().default(""),
    // Sinds 28-8-2026 heeft elk tekstveld zijn eigen lettertype — voor de
    // "oren"-vormen bestaat er geen lettertypekeuze (vaste typografie), dus
    // numberFontId is alleen nog verplicht voor de bestaande vormen (zie
    // superRefine).
    numberFontId: z.string().optional().default(""),
    line1FontId: z.string().optional().default(""),
    line2FontId: z.string().optional().default(""),
    // Geen lengte-/teken-eis hier op basisniveau: welke tekstvalidatie geldt
    // (houseNumberSchema voor bestaande vormen, houseNumberEarsSchema voor
    // "oren"-vormen) hangt af van de gekozen vorm en wordt hieronder in de
    // superRefine bepaald. `.trim()` hier zodat de GEPARSTE output
    // (createConfigurationSchema.parse(...).customText) net als voorheen
    // altijd getrimd is, voor beide takken.
    customText: z.string().trim(),
    extraLine1: extraLineSchema.optional().default(""),
    extraLine2: extraLineSchema.optional().default(""),
    numberPosition: z
      .enum(["start", "middle", "end"])
      .optional()
      .default("start"),
    // Optionele kaderrand — zie types/configuration.ts. Voor "oren"-vormen
    // bestaat deze optie niet (hasFrameChoice: false); zij laten dit veld
    // gewoon op de standaardwaarde `false` staan, er is geen aparte
    // verplichtstelling nodig.
    hasFrame: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const shape = productShapes.find((s) => s.id === data.shapeId);
    if (!shape) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Onbekende vorm.",
        path: ["shapeId"],
      });
      return;
    }

    if (isEarsShape(shape)) {
      // --- "Oren"-vormen (colorMode "ears-and-plate") — nieuw 9-9-2026 ---
      const textResult = houseNumberEarsSchema.safeParse(data.customText);
      if (!textResult.success) {
        for (const issue of textResult.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["customText"],
          });
        }
      }

      if (data.earColorId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kies een kleur voor de oren.",
          path: ["earColorId"],
        });
      }
      if (data.plateColorId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kies een kleur voor het vlak.",
          path: ["plateColorId"],
        });
      }

      // Bewust GEEN verplichtstelling van finish/sizeId/numberFontId hier —
      // deze vormen kennen geen afwerking-, maat- of lettertypekeuze (zie
      // types/product.ts, hasFinishChoice/hasSizeChoice/hasFontChoice).
      return;
    }

    // --- Bestaande vormen (colorMode "single") — dit stuk is functioneel
    // exact het gedrag van vóór de uitbreiding naar 7 vormen. ---
    if (!data.finish) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een afwerking.",
        path: ["finish"],
      });
    } else if (!shape.availableFinishes.includes(data.finish)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Afwerking "${data.finish}" is niet beschikbaar voor deze vorm.`,
        path: ["finish"],
      });
    }

    if (data.colorId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een kleur.",
        path: ["colorId"],
      });
    }

    if (data.sizeId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een maat.",
        path: ["sizeId"],
      });
    }

    if (data.numberFontId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een lettertype voor het huisnummer.",
        path: ["numberFontId"],
      });
    }

    const textResult = houseNumberSchema.safeParse(data.customText);
    if (!textResult.success) {
      for (const issue of textResult.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: ["customText"],
        });
      }
    }

    if (shape.extraLines >= 1 && data.extraLine1.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de eerste tekstregel in.",
        path: ["extraLine1"],
      });
    }
    if (shape.extraLines >= 1 && data.line1FontId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een lettertype voor tekstregel 1.",
        path: ["line1FontId"],
      });
    }

    if (shape.extraLines >= 2 && data.extraLine2.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de tweede tekstregel in.",
        path: ["extraLine2"],
      });
    }
    if (shape.extraLines >= 2 && data.line2FontId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een lettertype voor tekstregel 2.",
        path: ["line2FontId"],
      });
    }
  });

export type CreateConfigurationPayload = z.infer<typeof createConfigurationSchema>;

export const sendConfigurationEmailSchema = z.object({
  configurationId: z.string().uuid("Ongeldig configuratie-ID."),
});
