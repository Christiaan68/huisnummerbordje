"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { ContactDetailsForm } from "@/components/configurator/ContactDetailsForm";
import { QuestionModal } from "@/components/configurator/QuestionModal";
import { getVisibleSteps } from "@/lib/configuration/steps";
import { productShapes } from "@/config/product-options";
import { isEarsShape } from "@/lib/configuration/shape-helpers";
import type { CreateConfigurationInput } from "@/types/configuration";
import type { ContactDetails } from "@/lib/validation/contact.schema";

type Stage = "summary" | "contact";

export default function ControlePage() {
  const router = useRouter();
  const { selection } = useConfigurator();

  // De stap vóór "Controle" — voor de 4 oorspronkelijke vormen is dat
  // "Opties", maar sinds 9-9-2026 (7 vormen) slaan de "oren"-vormen die stap
  // over (geen kaderoptie, zie lib/configuration/steps.ts), dus daar is de
  // vorige stap "Tekst". Daarom hier, net als in ConfiguratorNav.tsx,
  // berekend op basis van de stappenlijst die voor de HUIDIG GEKOZEN vorm
  // van toepassing is (getVisibleSteps) in plaats van hardcoded of op basis
  // van de volledige, ongefilterde lijst.
  const visibleSteps = getVisibleSteps(selection);
  const controleStepIndex = visibleSteps.findIndex((s) => s.id === "controle");
  const previousStepPath =
    visibleSteps[controleStepIndex - 1]?.path ?? "/configurator/opties";

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
    router.push(previousStepPath);
  }

  // Sinds 9-9-2026 (7 vormen) is welke velden verplicht zijn afhankelijk van
  // de gekozen vorm: de "oren"-vormen (colorMode "ears-and-plate") kennen
  // geen afwerking-, kleur- (in de enkelvoudige zin) of lettertypekeuze en
  // hebben in plaats daarvan 2 losse verplichte kleuren (oren + vlak) — zie
  // types/product.ts (capability-vlaggen) en lib/validation/
  // configuration.schema.ts (dezelfde conditionele opbouw, daar met zod).
  // `incomplete` wordt per vorm-type apart bepaald; `selection.shapeId`/
  // `selection.sizeId` worden hieronder in de gecombineerde `if` gecheckt
  // (voor BEIDE vorm-types verplicht) zodat ze na deze guard narrowed zijn
  // naar niet-`null` voor de payload verderop.
  function isConfiguratieCompleet(): boolean {
    const shape = productShapes.find((s) => s.id === selection.shapeId);
    const incomplete = isEarsShape(shape)
      ? !selection.earColorId || !selection.plateColorId
      : !selection.finish || !selection.colorId || !selection.numberFontId;

    return Boolean(selection.shapeId) && Boolean(selection.sizeId) && !incomplete;
  }

  function handleConfiguratieBevestigen() {
    if (!isConfiguratieCompleet()) {
      setStatus("error");
      setMessage("Niet alle keuzes zijn compleet. Ga terug en vul ze aan.");
      return;
    }
    setStatus("idle");
    setMessage(null);
    setStage("contact");
  }

  async function handleContactSubmit(contact: ContactDetails) {
    if (!selection.shapeId || !selection.sizeId || !isConfiguratieCompleet()) {
      setStatus("error");
      setMessage("Niet alle keuzes zijn compleet. Ga terug en vul ze aan.");
      setStage("summary");
      return;
    }

    setStatus("submitting");
    setMessage(null);

    const shape = productShapes.find((s) => s.id === selection.shapeId);
    const earsShape = isEarsShape(shape);

    const payload: CreateConfigurationInput & ContactDetails = {
      shapeId: selection.shapeId,
      finish: selection.finish,
      // colorMode "ears-and-plate" (de "oren"-vormen): earColorId/
      // plateColorId meesturen i.p.v. de enkelvoudige colorId — zie
      // types/configuration.ts en lib/validation/configuration.schema.ts.
      // BEWUST `|| undefined` i.p.v. `null`: createConfigurationSchema
      // valideert deze velden met zods `.optional()` zonder `.nullable()`,
      // dus een niet-toepasselijk veld moet hier ONTBREKEN (`undefined`,
      // waardoor JSON.stringify de key weglaat) — een letterlijke `null`
      // zou de server-validatie laten falen (zie types/configuration.ts).
      colorId: earsShape ? undefined : selection.colorId || undefined,
      earColorId: earsShape ? selection.earColorId || undefined : undefined,
      plateColorId: earsShape ? selection.plateColorId || undefined : undefined,
      sizeId: selection.sizeId,
      numberFontId: earsShape ? undefined : selection.numberFontId || undefined,
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