"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactDetailsSchema, type ContactDetails } from "@/lib/validation/contact.schema";
import { cn } from "@/lib/utils";

interface ContactDetailsFormProps {
  onSubmit: (data: ContactDetails) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

export function ContactDetailsForm({
  onSubmit,
  onBack,
  isSubmitting,
}: ContactDetailsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactDetails>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      email: "",
      phone: "",
      quantity: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Naam
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={fieldClass(!!errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-foreground">
          Adres <span className="text-muted-foreground">(straat + huisnummer)</span>
        </label>
        <input
          id="address"
          type="text"
          {...register("address")}
          className={fieldClass(!!errors.address)}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-foreground">
            Postcode
          </label>
          <input
            id="postalCode"
            type="text"
            placeholder="1234 AB"
            {...register("postalCode")}
            className={fieldClass(!!errors.postalCode)}
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-destructive">{errors.postalCode.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-foreground">
            Woonplaats
          </label>
          <input
            id="city"
            type="text"
            {...register("city")}
            className={fieldClass(!!errors.city)}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className={fieldClass(!!errors.email)}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
          Telefoonnummer <span className="text-muted-foreground">(optioneel)</span>
        </label>
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          className={fieldClass(!!errors.phone)}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-foreground">
          Aantal
        </label>
        <input
          id="quantity"
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="1"
          {...register("quantity")}
          className={cn(fieldClass(!!errors.quantity), "w-24")}
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-destructive">{errors.quantity.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Terug
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? "Bezig..." : "Gegevens versturen"}
        </button>
      </div>
    </form>
  );
}
