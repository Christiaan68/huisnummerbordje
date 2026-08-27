"use client";

import { useEffect, useRef, useState } from "react";

// Zachte overgang naar langcat.nl (toegevoegd 27-8-2026, n.a.v. Christiaans
// opmerking over het grote contrast tussen deze donkere webshop en het
// felgele/lichte langcat.nl). Bewust volledig aan ONZE kant gehouden — er
// wordt niets aangepast aan langcat.nl zelf: op deze site dimt de pagina
// eerst, komt daarna in de kleursfeer van Langcat (geel, met hun logo), en
// pas dan opent het echte langcat.nl in een nieuw tabblad. Dit tabblad
// (met de webshop) blijft daarna gewoon zoals het was — het scherm faded
// simpelweg weer terug naar normaal.
//
// Bewust als los, zelfstandig component gehouden (in plaats van de
// bestaande <a>-tags aan te passen) zodat dit indien gewenst met één
// aanpassing weer teruggedraaid kan worden: gewoon weer een gewone <a
// href="https://www.langcat.nl/" target="_blank" rel="noopener noreferrer">
// gebruiken op de 2 plekken waar dit component nu gebruikt wordt
// (components/layout/Footer.tsx en app/contact/page.tsx), en dit bestand
// laten staan (ongebruikte code, geen risico) of verwijderen.
const LANGCAT_URL = "https://www.langcat.nl/";
const LANGCAT_LOGO_SRC = "/images/langcat-logo.jpg";

// Kleuren van de eigen sfeer (donkere webshop-achtergrond, zie
// app/globals.css --background) en van Langcat's sfeer (hun felgeel).
const SHOP_BACKGROUND = "hsl(165 14% 9%)";
const LANGCAT_YELLOW = "#FFCC00";

const DIM_MS = 500; // pagina dimt naar de eigen (donkere) achtergrondkleur
const RISE_MS = 1300; // kleurt door naar Langcat-geel, logo komt op
const HOLD_MS = 500; // even blijven staan in Langcat-sfeer
const FADE_BACK_MS = 600; // terug naar normaal (nieuw tabblad is dan al open)

type Phase = "idle" | "dimming" | "rising" | "hold" | "fading";

interface LangcatTransitionLinkProps {
  className?: string;
  children: React.ReactNode;
}

export function LangcatTransitionLink({
  className,
  children,
}: LangcatTransitionLinkProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Klikken met een muisknop-modifier (ctrl/cmd/shift/alt) of middelste
    // muisknop laten we gewoon door naar de browser (bv. "openen in nieuw,
    // niet-actief tabblad") — daar geen animatie overheen zetten.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    // Iemand die "verminderde beweging" heeft ingesteld: gewoon direct
    // doorschakelen, geen animatie.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    // Al een overgang bezig? Extra klikken negeren tot die klaar is.
    if (phase !== "idle") {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    // BELANGRIJK (fix 27-8-2026, n.a.v. Christiaans melding dat dit op
    // tablet/telefoon niet goed werkte): telefoons/tablets (vooral Safari
    // op iPhone/iPad) blokkeren een `window.open()` die pas ná een korte
    // vertraging (hier: na de animatie) wordt aangeroepen — dat wordt dan
    // gezien als een "pop-up" die niet direct het gevolg is van een tik,
    // en dus stilletjes tegengehouden. Op een computer viel dat vaak niet
    // op omdat browsers daar soepeler zijn, maar op mobiel gebeurde er dan
    // dus niets (of er verscheen geen nieuw tabblad).
    //
    // De oplossing: het nieuwe (voorlopig nog lege) tabblad DIRECT bij de
    // tik al openen — dat telt nog wel als "direct gevolg van een klik" —
    // en pas ná de animatie de echte langcat.nl-pagina daarin laden. Zo
    // ziet de bezoeker ook direct een nieuw tabblad verschijnen (fijne
    // bevestiging dat de tik is aangekomen), terwijl de animatie op deze
    // pagina gewoon doorloopt.
    let newTab: Window | null = null;
    try {
      newTab = window.open("", "_blank");
      if (newTab) {
        // Ontkoppelt het nieuwe tabblad van deze pagina (hetzelfde doel als
        // rel="noopener" bij een gewone link) — alleen kan dat hier niet
        // via het `rel`-attribuut, omdat we de referentie (newTab) juist
        // zelf nog even nodig hebben om er straks de echte pagina in te
        // laden.
        newTab.opener = null;
        newTab.document.write(
          `<!doctype html><title>Langcat Emaille</title><style>html,body{margin:0;height:100%;background:${LANGCAT_YELLOW};display:flex;align-items:center;justify-content:center;font-family:sans-serif}img{width:200px;border-radius:4px;box-shadow:0 10px 25px rgba(0,0,0,.35)}</style><body><img src="${window.location.origin}${LANGCAT_LOGO_SRC}" alt=""></body>`
        );
        newTab.document.close();
      }
    } catch {
      // Kon om wat voor reden dan ook geen alvast-leeg tabblad openen —
      // dan hieronder bij het echt doorschakelen alsnog een gewone poging
      // wagen.
      newTab = null;
    }

    setPhase("dimming");

    timers.current.push(
      window.setTimeout(() => setPhase("rising"), DIM_MS),
      window.setTimeout(() => setPhase("hold"), DIM_MS + RISE_MS),
      window.setTimeout(() => {
        if (newTab && !newTab.closed) {
          newTab.location.href = LANGCAT_URL;
        } else {
          // Zeldzaam noodgeval: het alvast-openen hierboven is niet gelukt
          // (of de bezoeker heeft dat tabblad intussen zelf gesloten) —
          // dan hier alsnog een gewone poging wagen.
          window.open(LANGCAT_URL, "_blank", "noopener,noreferrer");
        }
        setPhase("fading");
      }, DIM_MS + RISE_MS + HOLD_MS),
      window.setTimeout(
        () => setPhase("idle"),
        DIM_MS + RISE_MS + HOLD_MS + FADE_BACK_MS
      )
    );
  }

  const overlayVisible = phase !== "idle";
  const overlayColor =
    phase === "rising" || phase === "hold" || phase === "fading"
      ? LANGCAT_YELLOW
      : SHOP_BACKGROUND;
  const overlayDurationMs =
    phase === "dimming"
      ? DIM_MS
      : phase === "rising"
        ? RISE_MS
        : phase === "fading"
          ? FADE_BACK_MS
          : DIM_MS;

  return (
    <>
      <a
        href={LANGCAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}
      >
        {children}
      </a>

      {/* Puur decoratieve overlay — de link hierboven is en blijft een
          gewone, direct werkende link, dus voor toetsenbord/screenreader
          verandert er niets. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[100]"
        style={{
          opacity: overlayVisible ? 1 : 0,
          backgroundColor: overlayColor,
          transition: `opacity ${phase === "fading" ? FADE_BACK_MS : DIM_MS}ms ease-in-out, background-color ${overlayDurationMs}ms ease-in-out`,
        }}
      >
        <div
          className="flex h-full items-center justify-center"
          style={{
            opacity: phase === "rising" || phase === "hold" ? 1 : 0,
            transition: `opacity ${RISE_MS}ms ease-in-out`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LANGCAT_LOGO_SRC}
            alt=""
            className="w-48 rounded-sm shadow-[0_10px_25px_rgba(0,0,0,0.35)] sm:w-56"
          />
        </div>
      </div>
    </>
  );
}
