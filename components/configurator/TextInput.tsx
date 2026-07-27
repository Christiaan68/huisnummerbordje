"use client";

import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { productShapes } from "@/config/product-options";
import { houseNumberSchema, extraLineSchema } from "@/lib/validation/text-input.schema";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

export function TextInput() {
  const { selection, dispatch } = useConfigurator();

  const shape = productShapes.find((s) => s.id === selection.shapeId);
  const extraLines = shape?.extraLines ?? 0;

  const houseNumberResult = selection.customText
    ? houseNumberSchema.safeParse(selection.customText)
    : null;
  const line1Result = selection.extraLine1
    ? extraLineSchema.safeParse(selection.extraLine1)
    : null;
  const line2Result = selection.extraLine2
    ? extraLineSchema.safeParse(selection.extraLine2)
    : null;

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <label
          htmlFor="huisnummer"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Huisnummer <span className="text-muted-foreground">(max. 2 tekens)</span>
        </label>
        <input
          id="huisnummer"
          type="text"
          maxLength={2}
          value={selection.customText}
          onChange={(e) =>
            dispatch({ type: "SET_TEXT", customText: e.target.value })
          }
          placeholder="bv. 12"
          className={cn(
            "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
            houseNumberResult && !houseNumberResult.success
              ? "border-destructive"
              : "border-border focus:border-primary"
          )}
        />
        <FieldError
          message={
            houseNumberResult && !houseNumberResult.success
              ? houseNumberResult.error.issues[0]?.message
              : undefined
          }
        />
      </div>

      {extraLines >= 1 && (
        <div>
          <label
            htmlFor="regel1"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Tekstregel 1 <span className="text-muted-foreground">(max. 20 tekens)</span>
          </label>
          <input
            id="regel1"
            type="text"
            maxLength={20}
            value={selection.extraLine1}
            onChange={(e) =>
              dispatch({ type: "SET_EXTRA_LINE_1", value: e.target.value })
            }
            placeholder="bv. Van Dijk"
            className={cn(
              "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
              line1Result && !line1Result.success
                ? "border-destructive"
                : "border-border focus:border-primary"
            )}
          />
          <FieldError
            message={
              line1Result && !line1Result.success
                ? line1Result.error.issues[0]?.message
                : undefined
            }
          />
        </div>
      )}

      {extraLines >= 2 && (
        <div>
          <label
            htmlFor="regel2"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Tekstregel 2 <span className="text-muted-foreground">(max. 20 tekens)</span>
          </label>
          <input
            id="regel2"
            type="text"
            maxLength={20}
            value={selection.extraLine2}
            onChange={(e) =>
              dispatch({ type: "SET_EXTRA_LINE_2", value: e.target.value })
            }
            placeholder="bv. Dorpsstraat 12"
            className={cn(
              "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
              line2Result && !line2Result.success
                ? "border-destructive"
                : "border-border focus:border-primary"
            )}
          />
          <FieldError
            message={
              line2Result && !line2Result.success
                ? line2Result.error.issues[0]?.message
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
