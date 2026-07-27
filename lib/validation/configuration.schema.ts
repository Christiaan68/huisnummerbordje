import { z } from "zod";
import { houseNumberSchema, extraLineSchema } from "./text-input.schema";
import { productShapes } from "@/config/product-options";

/**
 * Server-side validatieschema voor POST /api/configuration.
 * Vertrouw nooit alleen op client-side validatie.
 *
 * De extra tekstregels zijn optioneel op schemaniveau, maar worden hieronder
 * verplicht gesteld afhankelijk van hoeveel regels de gekozen vorm toestaat
 * (0, 1 of 2), via superRefine.
 */
export const createConfigurationSchema = z
  .object({
    shapeId: z.string().min(1, "Kies een vorm."),
    finish: z.enum(["vlak", "gewelfd"], {
      errorMap: () => ({ message: "Kies een afwerking." }),
    }),
    colorId: z.string().min(1, "Kies een kleur."),
    sizeId: z.string().min(1, "Kies een maat."),
    fontId: z.string().min(1, "Kies een lettertype."),
    customText: houseNumberSchema,
    extraLine1: extraLineSchema.optional().default(""),
    extraLine2: extraLineSchema.optional().default(""),
    numberSizeMm: z.number(),
    line1SizeMm: z.number().optional(),
    line2SizeMm: z.number().optional(),
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

    if (!shape.availableFinishes.includes(data.finish)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Afwerking "${data.finish}" is niet beschikbaar voor deze vorm.`,
        path: ["finish"],
      });
    }

    const { min, max } = shape.characterSizeRange;
    const { min: lineMin, max: lineMax } = shape.lineSizeRange;
    const checkSize = (
      mm: number | undefined,
      path: string,
      label: string,
      range: { min: number; max: number }
    ) => {
      if (mm === undefined || mm < range.min || mm > range.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} moet tussen ${range.min} en ${range.max} mm liggen.`,
          path: [path],
        });
      }
    };
    checkSize(data.numberSizeMm, "numberSizeMm", "Tekengrootte huisnummer", {
      min,
      max,
    });

    if (shape.extraLines >= 1 && data.extraLine1.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de eerste tekstregel in.",
        path: ["extraLine1"],
      });
    }
    if (shape.extraLines >= 1) {
      checkSize(data.line1SizeMm, "line1SizeMm", "Tekengrootte regel 1", {
        min: lineMin,
        max: lineMax,
      });
    }

    if (shape.extraLines >= 2 && data.extraLine2.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de tweede tekstregel in.",
        path: ["extraLine2"],
      });
    }
    if (shape.extraLines >= 2) {
      checkSize(data.line2SizeMm, "line2SizeMm", "Tekengrootte regel 2", {
        min: lineMin,
        max: lineMax,
      });
    }
  });

export type CreateConfigurationPayload = z.infer<typeof createConfigurationSchema>;

export const sendConfigurationEmailSchema = z.object({
  configurationId: z.string().uuid("Ongeldig configuratie-ID."),
});
