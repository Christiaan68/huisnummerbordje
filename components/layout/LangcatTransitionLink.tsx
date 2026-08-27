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

// DIM_MS bewust ruim gehouden (n.a.v. Christiaans melding dat op de
// iPhone geen enkele overgang te zien was, alleen meteen geel): het openen
// van een gloednieuw tabblad kost een browser zelf ook al even tijd (denk
// aan het animatietje van de tabbladwissel) — was deze waarde te kort, dan
// kon het gebeuren dat de browser de donkere beginstand nooit echt op het
// scherm liet zien voordat het al naar geel overging.
const DIM_MS = 900; // pagina dimt naar de eigen (donkere) achtergrondkleur
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

    // BELANGRIJK (fix 27-8-2026, n.a.v. Christiaans meldingen over
    // tablet/telefoon): een `window.open()` die pas ná de animatie wordt
    // aangeroepen, wordt door telefoons/tablets vaak stilletjes
    // tegengehouden (niet gezien als direct gevolg van een tik) — dus
    // wordt het nieuwe tabblad direct bij de tik al geopend (dat telt nog
    // wel als "direct gevolg van een tik").
    //
    // Tweede probleem (n.a.v. Christiaans test op laptop/tablet): zodra dat
    // nieuwe tabblad opent, springen sommige browsers er meteen naartoe —
    // deze shop-pagina komt dan op de achtergrond te staan. Op met name
    // tablets kan een pagina op de achtergrond zo ver "bevroren" worden
    // door de browser dat een wachttijdje (setTimeout) daar simpelweg nooit
    // meer afgaat — waardoor het nieuwe tabblad dan voor altijd op het
    // gele wachtscherm bleef staan in plaats van door te schakelen naar de
    // echte langcat.nl. Daarom laat het nieuwe tabblad zichzelf nu de
    // sfeerovergang tonen én zichzelf na afloop doorschakelen — dat werkt
    // altijd, ongeacht of deze shop-pagina op de voor- of achtergrond komt
    // te staan. Deze shop-pagina zelf speelt de overgang ook nog af (voor
    // het geval de browser 'm niet meteen wegklikt), maar is daarna verder
    // nergens meer verantwoordelijk voor.
    try {
      const newTab = window.open("", "_blank");
      if (newTab) {
        // Ontkoppelt het nieuwe tabblad van deze pagina (hetzelfde doel als
        // rel="noopener" bij een gewone link, alleen kan dat hier niet via
        // het `rel`-attribuut omdat we newTab hierboven nog even nodig
        // hebben).
        newTab.opener = null;
        newTab.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Langcat Emaille</title>
<style>
  html,body{margin:0;height:100%;overflow:hidden}
  #ov{position:fixed;inset:0;background:${SHOP_BACKGROUND};display:flex;align-items:center;justify-content:center;transition:background-color ${RISE_MS}ms ease-in-out}
  img{width:200px;border-radius:4px;box-shadow:0 10px 25px rgba(0,0,0,.35);opacity:0;transition:opacity ${RISE_MS}ms ease-in-out}
</style></head>
<body>
  <div id="ov"><img id="logo" src="${window.location.origin}${LANGCAT_LOGO_SRC}" alt=""></div>
  <script>
    // Dubbele requestAnimationFrame: wacht tot de browser de donkere
    // beginstand minstens 1x echt heeft getekend, vóórdat we naar geel
    // laten overgaan. Zonder dit kon het (vooral op iPhone) gebeuren dat
    // er nog niets getekend was op het moment dat we al naar geel
    // overschakelden, waardoor er niets van de overgang te zien was.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        setTimeout(function () {
          document.getElementById("ov").style.backgroundColor = "${LANGCAT_YELLOW}";
          document.getElementById("logo").style.opacity = "1";
        }, ${DIM_MS});
      });
    });
    setTimeout(function () {
      window.location.href = "${LANGCAT_URL}";
    }, ${DIM_MS + RISE_MS + HOLD_MS});
  <\/script>
</body></html>`);
        newTab.document.close();
      } else {
        // Zeldzaam noodgeval: kon niet eens een leeg tabblad openen — dan
        // toch een gewone (mogelijk tegengehouden) poging wagen.
        window.open(LANGCAT_URL, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(LANGCAT_URL, "_blank", "noopener,noreferrer");
    }

    // Vanaf hier alleen nog de (puur decoratieve) overgang op déze pagina —
    // zie toelichting hierboven.
    setPhase("dimming");

    timers.current.push(
      window.setTimeout(() => setPhase("rising"), DIM_MS),
      window.setTimeout(() => setPhase("hold"), DIM_MS + RISE_MS),
      window.setTimeout(() => setPhase("fading"), DIM_MS + RISE_MS + HOLD_MS),
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
