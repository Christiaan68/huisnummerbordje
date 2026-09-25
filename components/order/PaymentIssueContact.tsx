"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PaymentIssueContactProps {
  orderId: number;
  paymentStatusLabel: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  contactAddress: string;
  contactPostalCode: string;
  contactCity: string;
  shapeName: string;
  finish: "vlak" | "gewelfd";
  colorName?: string | null;
  printColorName?: string | null;
  earColorName?: string | null;
  plateColorName?: string | null;
  sizeName: string;
  customText: string;
  extraLine1?: string | null;
  extraLine2?: string | null;
  priceLabel: string;
}

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

/**
 * Knop + pop-up op de bedankt-pagina (zie app/bestelling/bedankt/page.tsx)
 * waarmee een klant, terwijl de betaling nog verwerkt wordt, een vraag kan
 * stellen over zijn bestelling — met zijn bestelgegevens er automatisch
 * (alleen-lezen) bij. Toegevoegd 16-9-2026, op verzoek van Christiaan.
 *
 * Verstuurt via app/api/payment-issue/route.ts, dat de bestelgegevens zelf
 * opnieuw uit de database ophaalt — deze pop-up stuurt alleen orderId + de
 * getypte vraag mee, nooit de hier getoonde gegevens zelf (zie de
 * toelichting in die route).
 */
export function PaymentIssueContact(props: PaymentIssueContactProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpen() {
    setOpen(true);
    setStatus("idle");
    setErrorMessage(null);
  }

  function handleClose() {
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("Vul je vraag in.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/payment-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: props.orderId, question: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setStatus("error");
        setErrorMessage(
          data?.error ?? "Er ging iets mis bij het versturen. Probeer het opnieuw."
        );
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw."
      );
    }
  }

  const summaryRows: Array<[string, string]> = [
    ["Ordernummer", `#${props.orderId}`],
    ["Betaalstatus", props.paymentStatusLabel],
    ["Naam", props.contactName],
    ["E-mail", props.contactEmail],
    ...(props.contactPhone ? ([["Telefoon", props.contactPhone]] as [string, string][]) : []),
    ["Adres", `${props.contactAddress}, ${props.contactPostalCode} ${props.contactCity}`],
    ["Vorm", props.shapeName],
    ["Afwerking", props.finish === "vlak" ? "Vlak" : "Gewelfd"],
    ...(props.colorName ? ([["Ondergrond kleur", props.colorName]] as [string, string][]) : []),
    ...(props.printColorName
      ? ([["Opdruk kleur", props.printColorName]] as [string, string][])
      : []),
    ...(props.plateColorName
      ? ([["Ondergrond kleur", props.plateColorName]] as [string, string][])
      : []),
    ...(props.earColorName ? ([["Opdruk kleur", props.earColorName]] as [string, string][]) : []),
    ["Maat", props.sizeName],
    ["Huisnummer", props.customText],
    ...(props.extraLine1 ? ([["Tekstregel 1", props.extraLine1]] as [string, string][]) : []),
    ...(props.extraLine2 ? ([["Tekstregel 2", props.extraLine2]] as [string, string][]) : []),
    ["Prijs", props.priceLabel],
  ];

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-sm border border-border bg-secondary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
      >
        Vraag over deze bestelling
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8">
          <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-lg sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-xl text-primary">
                Vraag over je bestelling
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Sluiten"
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {status === "success" ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  Bedankt! Je vraag is verstuurd, met je bestelgegevens erbij. We
                  nemen zo snel mogelijk contact met je op via{" "}
                  {props.contactEmail}.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Sluiten
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Je gegevens en gekozen configuratie sturen we automatisch mee,
                  zodat we precies weten om welke bestelling het gaat.
                </p>

                <div className="mt-4 max-h-48 overflow-y-auto rounded-sm border border-border bg-secondary/40 px-4 py-2">
                  {summaryRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="payment-issue-question"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Je vraag
                    </label>
                    <textarea
                      id="payment-issue-question"
                      rows={4}
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      className={fieldClass(status === "error" && !question.trim())}
                    />
                  </div>

                  {status === "error" && errorMessage && (
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  )}

                  <div className="flex items-center justify-end gap-4 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {status === "submitting" ? "Bezig..." : "Vraag versturen"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
