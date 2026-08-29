"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { ContactDetailsForm } from "@/components/configurator/ContactDetailsForm";
import { QuestionModal } from "@/components/configurator/QuestionModal";
import { configuratorSteps } from "@/lib/configuration/steps";
import type { CreateConfigurationInput } from "@/types/configuration";
import type { ContactDetails } from "@/lib/validation/contact.schema";

type Stage = "summary" | "contact";

// De stap vóór "Controle" — op dit moment "Opties" — wordt hier uit
// steps.ts opgezocht in plaats van hardcoded, zodat dit vanzelf blijft
// kloppen als de volgorde van de configurator-stappen ooit wijzigt. Zelfde
// bron als ConfiguratorNav.tsx (de "Terug"-knop op alle andere stappen)
// gebruikt.
const CONTROLE_STEP_INDEX = configuratorSteps.findIndex((s) => s.id === "controle");
const PREVIOUS_STEP_PATH =
  configuratorSteps[CONTROLE_STEP_INDEX - 1]?.path ?? "/configurator/opties";

export default function ControlePage() {
  const router = useRouter();
  const { selection } = useConfigurator();
  const [stage, setStage] = useState<Stage>("summary");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "notice">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  // Voorheen "Wijzigen" (ging helemaal terug naar stap 1, "Vorm") — op
  // verzoek van Christiaan (29-8-2026) vervangen door een gewone "Terug",
  // die net als op alle andere stappen maar één stap terug gaat (naar
  // "Opties"), in plaats van de hele configuratie kwijt te raken.
  function handleTerug() {
    router.push(PREVIOUS_STEP_PATH);
  }

  function handleConfiguratieBevestigen() {
    if (
      !selection.shapeId ||
      !selection.finish ||
      !selection.colorId ||
      !selection.sizeId ||
      !selection.numberFontId
    ) {
      setStatus("error");
      setMessage("Niet alle keuzes zijn compleet. Ga terug en vul ze aan.");
      return;
    }
    setStatus("idle");
    setMessage(null);
    setStage("contact");
  }

  async function handleContactSubmit(contact: ContactDetails) {
    if (
      !selection.shapeId ||
      !selection.finish ||
      !selection.colorId ||
      !selection.sizeId ||
      !selection.numberFontId
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
      numberFontId: selection.numberFontId,
      line1FontId: selection.line1FontId || undefined,
      line2FontId: selection.line2FontId || undefined,
      customText: selection.customText,
      extraLine1: selection.extraLine1 || undefined,
      extraLine2: selection.extraLine2 || undefined,
      numberPosition: selection.numberPosition,
      hasFrame: selection.hasFrame,
      ...contact,
    };

    try {
      // Sinds 29-8-2026 (Mollie): dit start alleen nog de betaling — de
      // bevestigingsmails gaan pas uit ná een gelukte betaling, zie
      // app/api/create-payment/route.ts en app/api/mollie-webhook/route.ts.
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setMessage(
          data?.error ?? "Er ging iets mis bij het versturen. Probeer het opnieuw."
        );
        return;
      }

      if (!data?.checkoutUrl) {
        setStatus("error");
        setMessage("Er ging iets mis bij het starten van de betaling. Probeer het opnieuw.");
        return;
      }

      // Bewuste, volledige paginanavigatie (niet router.push): de klant
      // verlaat de webshop hier echt, naar de betaalpagina van Mollie.
      window.location.href = data.checkoutUrl;
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
        Configurator — stap 7 van 7
      </p>
      <h1 className="mt-1 font-serif text-2xl text-primary">
        {stage === "summary" && "Controle"}
        {stage === "contact" && "Jouw gegevens"}
      </h1>

      {stage === "summary" && (
        <>
          <p className="mt-4 text-muted-foreground">
            Controleer je configuratie hieronder. Klopt alles? Bevestig dan je
            bestelling. Wil je nog iets aanpassen? Klik op &quot;Terug&quot; om
            naar de vorige stap te gaan.
          </p>

          <div className="mt-8">
            <ConfigurationSummary />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Twijfel je nog, of heb je een vraag over deze configuratie?{" "}
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Stel hier je vraag
            </button>
            .
          </p>

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
              onClick={handleTerug}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Terug
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
            Vul je gegevens in — daarna ga je verder naar de betaalpagina om
            je bestelling af te ronden.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Nog een vraag voordat je bevestigt?{" "}
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(true)}
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Stel hier je vraag
            </button>
            .
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

      {isQuestionModalOpen && (
        <QuestionModal onClose={() => setIsQuestionModalOpen(false)} />
      )}
    </div>
  );
}