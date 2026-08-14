import { z } from "zod";
import { houseNumberSchema, extraLineSchema } from "./text-input.schema";
import { productShapes } from "@/config/product-options";

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
    numberPosition: z
      .enum(["start", "middle", "end"])
      .optional()
      .default("start"),
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

    if (shape.extraLines >= 1 && data.extraLine1.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de eerste tekstregel in.",
        path: ["extraLine1"],
      });
    }

    if (shape.extraLines >= 2 && data.extraLine2.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vul de tweede tekstregel in.",
        path: ["extraLine2"],
      });
    }
  });

export type CreateConfigurationPayload = z.infer<typeof createConfigurationSchema>;

export const sendConfigurationEmailSchema = z.object({
  configurationId: z.string().uuid("Ongeldig configuratie-ID."),
});