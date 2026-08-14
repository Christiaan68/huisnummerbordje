"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { ContactDetailsForm } from "@/components/configurator/ContactDetailsForm";
import type { CreateConfigurationInput } from "@/types/configuration";
import type { ContactDetails } from "@/lib/validation/contact.schema";

type Stage = "summary" | "contact" | "success";

export default function ControlePage() {
  const router = useRouter();
  const { selection, dispatch } = useConfigurator();
  const [stage, setStage] = useState<Stage>("summary");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "notice">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  function handleWijzigen() {
    router.push("/configurator/vorm");
  }

  function handleConfiguratieBevestigen() {
    if (
      !selection.shapeId ||
      !selection.finish ||
      !selection.colorId ||
      !selection.sizeId ||
      !selection.fontId
    ) {
      setStatus("error");
      setMessage("Niet alle keuzes zijn compleet. Ga terug en vul ze aan.");
      return;
    }
    setStatus("idle");
    setMessage(null);
    setStage("contact");
  }

  function handleNaarHome() {
    dispatch({ type: "RESET" });
    router.push("/");
  }

  async function handleContactSubmit(contact: ContactDetails) {
    if (
      !selection.shapeId ||
      !selection.finish ||
      !selection.colorId ||
      !selection.sizeId ||
      !selection.fontId
    ) {
      setStatus("error");
      setMessage("Niet alle keuzes zijn compleet. Ga terug en vul ze aan.");
      setStage("summary");
      return;
    }

    setStatus("submitting");
    setMessage(null);

    const payload: CreateConfigurationInput & ContactDetails = {
      shapeId: selection.shapeId,
      finish: selection.finish,
      colorId: selection.colorId,
      sizeId: selection.sizeId,
      fontId: selection.fontId,
      customText: selection.customText,
      extraLine1: selection.extraLine1 || undefined,
      extraLine2: selection.extraLine2 || undefined,
      numberPosition: selection.numberPosition,
      ...contact,
    };

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setStatus("error");
        setMessage(
          data?.error ?? "Er ging iets mis bij het versturen. Probeer het opnieuw."
        );
        return;
      }

      const data = await response.json().catch(() => null);
      if (data?.warning) {
        setStatus("error");
        setMessage(data.warning);
        return;
      }

      setStatus("notice");
      setMessage("Je configuratie en gegevens zijn bevestigd en per e-mail verstuurd!");
      setStage("success");
    } catch {
      setStatus("error");
      setMessage(
        "Kan geen verbinding maken met de server. Controleer je internetverbinding en probeer het opnieuw."
      );
    }
  }

  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Configurator — stap 6 van 6
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">
        {stage === "summary" && "Controle"}
        {stage === "contact" && "Jouw gegevens"}
        {stage === "success" && "Bedankt!"}
      </h1>

      {stage === "summary" && (
        <>
          <p className="mt-4 text-muted-foreground">
            Controleer je configuratie hieronder. Klopt alles? Bevestig dan je
            bestelling. Wil je nog iets aanpassen? Klik op &quot;Wijzigen&quot;.
          </p>

          <div className="mt-8">
            <ConfigurationSummary />
          </div>

          {message && (
            <p
              className={
                status === "error"
                  ? "mt-6 text-sm text-destructive"
                  : "mt-6 text-sm text-accent"
              }
            >
              {message}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleWijzigen}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Wijzigen
            </button>

            <button
              type="button"
              onClick={handleConfiguratieBevestigen}
              className="inline-flex items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Configuratie bevestigen
            </button>
          </div>
        </>
      )}

      {stage === "contact" && (
        <>
          <p className="mt-4 text-muted-foreground">
            Vul je gegevens in, dan sturen we je configuratie inclusief deze
            gegevens naar ons door.
          </p>

          <div className="mt-8">
            <ContactDetailsForm
              onSubmit={handleContactSubmit}
              onBack={() => setStage("summary")}
              isSubmitting={status === "submitting"}
            />
          </div>

          {message && (
            <p
              className={
                status === "error"
                  ? "mt-6 text-sm text-destructive"
                  : "mt-6 text-sm text-accent"
              }
            >
              {message}
            </p>
          )}
        </>
      )}

      {stage === "success" && (
        <>
          <p className="mt-4 text-muted-foreground">{message}</p>

          <div className="mt-10 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleNaarHome}
              className="inline-flex items-center justify-center rounded-sm border border-border bg-secondary px-8 py-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
            >
              Naar home
            </button>
          </div>
        </>
      )}
    </div>
  );
}