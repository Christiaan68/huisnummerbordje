// Gedeelde geometrie- en kleurlogica voor de visuele weergave van een
// bordje. Wordt gebruikt door zowel de live preview in de configurator
// (components/configurator/ProductPreview.tsx) als de serverside
// voorbeeldafbeelding die in de bevestigingsmail aan de klant wordt
// meegestuurd (lib/email/plate-preview-image.tsx).
//
// Bewust op één plek gehouden: dit is precies de logica die op 19-8-2026 is
// aangepast omdat tekst op een ovaal bordje (vanaf 3 tekens, vooral bij het
// lettertype "Klassiek") over de schroefjes heen kon lopen. Als deze logica
// dubbel had gestaan (client + server), was de kans groot dat een latere
// aanpassing maar op één plek was doorgevoerd en de twee weergaves weer uit
// elkaar waren gaan lopen.

// Rechthoekige vormen: positie van de schroefgaatjes, meermaals bijgesteld
// op verzoek van Christiaan op 28-8-2026 (was oorspronkelijk 0.11, toen
// 0.085; een tussentijdse poging om "precies halverwege kader en hoek" te
// zitten (0,0239) duwde het gaatje bij langwerpige maten als 105×210 over
// de korte bordjesrand heen en is teruggedraaid). Deze verhouding stuurt
// ALLEEN de schroefpositie zelf (en de tekst-veiligheidsmarge eromheen,
// zie getScrewClearanceMarginsMm) — sinds de laatste aanpassing NIET meer
// de kaderlijn: die gebruikt hieronder een eigen, vaste verhouding
// (FRAME_CORNER_ANCHOR_RATIO) zodat het kader onveranderd blijft staan,
// ook als de schroefpositie hierna weer verschuift. Bij deze waarde blijft
// er dus automatisch nóg meer ruimte tot het kader over dan voorheen (het
// gaatje komt dichter bij de hoek, het kader blijft op zijn plek).
export const SCREW_INSET_RATIO = 0.065;

// Ovale vorm: schroefpositie als fractie vanaf het midden op de lange as
// (zie getScrewPositions) — los van de rechthoekige logica hierboven, want
// de ovale kaderlijn (getOvalFrameBorderPath) is een vaste ellips zonder
// inkeping die niet automatisch meebeweegt met de schroefpositie.
export const OVAL_SCREW_AXIS_RATIO = 0.44;

// Placeholder-verhouding (breedte/hoogte) voor een ovaal bordje zolang er
// nog geen maat gekozen is — zie ProductPreview.tsx voor de toelichting.
export const DEFAULT_OVAL_RATIO = 1.4;

// Op verzoek van Christiaan op 28-8-2026 gehalveerd (was 0.045) — de
// schroefgaatjes in alle previews (live configurator + bevestigingsmail)
// oogden te groot. Omdat dit de enige plek is waar de schroefstraal
// vandaan komt, werkt dit automatisch door in de tekst-marges
// (getScrewClearanceMarginsMm) en de kaderlijn-hoekbogen
// (getFrameBorderPath) — die blijven daardoor kloppen bij de nieuwe,
// kleinere schroefjes.
const SCREW_RADIUS_RATIO = 0.0225; // van min(breedte, hoogte) van het bordje
const SCREW_CLEARANCE_BUFFER_MM = 3;

export function getContrastTextColor(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#f7f5f0";
}

export function getScrewRadiusMm(widthMm: number, heightMm: number): number {
  return Math.min(widthMm, heightMm) * SCREW_RADIUS_RATIO;
}

/**
 * Schroefposities als verhouding (0 t/m 1) van de breedte/hoogte van het
 * bordje. Rechthoekig bordje: 4 schroefjes, één in elke hoek. Ovaal bordje:
 * 2 schroefjes, aan de langste uiteinden (op de langste as — besloten door
 * Christiaan op 19-8-2026).
 */
export function getScrewPositions(
  isOval: boolean,
  widthMm: number,
  heightMm: number
): [number, number][] {
  if (isOval) {
    return widthMm >= heightMm
      ? [
          [0.5 - OVAL_SCREW_AXIS_RATIO, 0.5],
          [0.5 + OVAL_SCREW_AXIS_RATIO, 0.5],
        ]
      : [
          [0.5, 0.5 - OVAL_SCREW_AXIS_RATIO],
          [0.5, 0.5 + OVAL_SCREW_AXIS_RATIO],
        ];
  }
  return [
    [SCREW_INSET_RATIO, SCREW_INSET_RATIO],
    [1 - SCREW_INSET_RATIO, SCREW_INSET_RATIO],
    [SCREW_INSET_RATIO, 1 - SCREW_INSET_RATIO],
    [1 - SCREW_INSET_RATIO, 1 - SCREW_INSET_RATIO],
  ];
}

/**
 * Minimale marge (in mm) die vrijgehouden moet worden zodat de automatisch
 * berekende tekstgrootte (zie computeAutoFit in text-fit.ts) niet over de
 * schroefjes heen loopt.
 */
export function getScrewClearanceMarginsMm(
  isOval: boolean,
  widthMm: number,
  heightMm: number
): { minMarginXMm: number; minMarginYMm: number } {
  const screwRadiusMm = getScrewRadiusMm(widthMm, heightMm);

  if (isOval) {
    const longAxisIsWidth = widthMm >= heightMm;
    const axisMarginMm =
      (longAxisIsWidth ? widthMm : heightMm) * (0.5 - OVAL_SCREW_AXIS_RATIO) +
      screwRadiusMm +
      SCREW_CLEARANCE_BUFFER_MM;
    return longAxisIsWidth
      ? { minMarginXMm: axisMarginMm, minMarginYMm: 0 }
      : { minMarginXMm: 0, minMarginYMm: axisMarginMm };
  }

  return {
    minMarginXMm:
      widthMm * SCREW_INSET_RATIO + screwRadiusMm + SCREW_CLEARANCE_BUFFER_MM,
    minMarginYMm:
      heightMm * SCREW_INSET_RATIO + screwRadiusMm + SCREW_CLEARANCE_BUFFER_MM,
  };
}

// Sierrand ("kader") — optionele extra op het bordje (toegevoegd 25-8-2026,
// n.a.v. voorbeeldfoto's van Christiaan). Aanvankelijk alleen voor
// rechthoekige vormen (niet "ovaal"), maar sinds 28-8-2026 ook beschikbaar
// voor de ovale vorm — zie getOvalFrameBorderPath verderop in dit bestand.
//
// Dit pad is meermaals herzien op basis van Christiaans feedback en foto's
// van een echt bordje ("172"), voordat de vorm klopte. De doorbraak kwam
// door een scherpe rechte-hoek-foto pixel voor pixel op te meten: de
// kaderlijn bij elke hoek is een cirkelboog met de HOEK VAN HET BORDJE ZELF
// als middelpunt (dus niet — zoals eerdere pogingen aannamen — een boog
// rond het schroefje, en ook niet een gewone afgeronde rechthoekhoek). De
// rechte stukken lopen vlak langs de rand (dicht bij de rand, dus duidelijk
// buiten de schroefjes) tot ze deze cirkel (met straal groot genoeg om het
// schroefje ruim te omvatten) raken, buigen dan met die boog naar binnen —
// om het schroefje heen, dat net als de bordjeshoek zelf "binnen" die boog
// blijft staan, dus buiten het kader — en weer terug naar de volgende
// rechte zijde. Dat geeft precies de karakteristieke "inkeping" bij elk
// schroefje die op de foto's te zien is.
export const FRAME_STROKE_WIDTH_RATIO = 0.014; // lijndikte, t.o.v. min(breedte, hoogte)

// Afstand van de rechte kaderlijn tot de bordjesrand, t.o.v. min(breedte,
// hoogte) — bewust klein, want de kaderlijn moet langs de rechte zijden
// duidelijk dichter bij de rand lopen dan bij de hoeken, waar de boog juist
// naar binnen buigt om het schroefje heen.
const FRAME_EDGE_INSET_RATIO = 0.03;

// Extra marge rond het schroefje (als veelvoud van de schroefstraal) die de
// hoekboog minimaal moet vrijhouden, bovenop de schroefstraal zelf.
const FRAME_CORNER_MARGIN_TO_SCREW_RATIO = 0.5;

// Vaste referentie-verhouding voor de kaderlijn-hoekboog (rechthoekig) —
// bewust LOS van SCREW_INSET_RATIO gehouden sinds 28-8-2026, op verzoek
// van Christiaan ("de gaatjes moeten iets verder de hoek in, maar het
// kader moet ongewijzigd blijven"). Dit is dezelfde waarde als de vorige
// SCREW_INSET_RATIO (0,085): de kaderlijn ziet er dus nog exact zo uit als
// daarvoor, ook al zit het schroefgaatje er nu dichter bij de hoek. Omdat
// deze afstand groter is dan de daadwerkelijke (nieuwe) schroefafstand tot
// de hoek, blijft de boog het schroefje sowieso ruim vrijlaten — het kader
// hoeft dus niet "mee te bewegen" met de schroefpositie om veilig te
// blijven.
const FRAME_CORNER_ANCHOR_RATIO = 0.085;

/**
 * Bouwt het SVG-pad voor de kaderlijn, in dezelfde mm-coördinaten als de
 * rest van de bordjestekening. De lijn loopt vlak langs de rand van het
 * bordje (dus buiten de schroefjes) en buigt bij elke hoek met een boog om
 * de bordjeshoek naar binnen en weer terug — groot genoeg om het schroefje
 * in die hoek vrij te laten, zoals op Christiaans foto's van een echt
 * bordje. Wordt gebruikt door zowel de live preview (ProductPreview.tsx) als
 * de voorbeeldafbeelding in de bevestigingsmail (plate-preview-image.tsx) —
 * zie de toelichting bovenaan dit bestand over waarom dit soort logica op
 * één plek hoort te staan.
 */
export function getFrameBorderPath(widthMm: number, heightMm: number): string {
  const minDim = Math.min(widthMm, heightMm);
  const fi = minDim * FRAME_EDGE_INSET_RATIO;
  const screwRadius = getScrewRadiusMm(widthMm, heightMm);

  // Straal van de hoekboog, gemeten vanaf de bordjeshoek zelf. Gebruikt
  // bewust FRAME_CORNER_ANCHOR_RATIO in plaats van de (huidige)
  // SCREW_INSET_RATIO, zodat het kader een vaste vorm houdt onafhankelijk
  // van waar het schroefgaatje precies staat — zie de toelichting bij
  // FRAME_CORNER_ANCHOR_RATIO hierboven. Deze afstand is ruim genoeg om
  // het daadwerkelijke (dichter bij de hoek geplaatste) schroefje sowieso
  // vrij te laten.
  const cornerToScrewDist =
    FRAME_CORNER_ANCHOR_RATIO * Math.hypot(widthMm, heightMm);
  let r =
    cornerToScrewDist +
    screwRadius +
    screwRadius * FRAME_CORNER_MARGIN_TO_SCREW_RATIO;

  // Veiligheidsgrens: het punt waar de rechte lijn de boog raakt ("knee")
  // mag niet voorbij het midden van de kortste zijde komen, anders zouden
  // twee hoekbogen elkaar overlappen.
  const maxHalf = Math.min(widthMm, heightMm) / 2 - fi - 1;
  if (maxHalf > 0) {
    r = Math.min(r, Math.hypot(maxHalf, fi));
  }
  const knee = Math.sqrt(Math.max(r * r - fi * fi, 0));

  return [
    `M ${knee} ${fi}`,
    `L ${widthMm - knee} ${fi}`,
    `A ${r} ${r} 0 0 0 ${widthMm - fi} ${knee}`,
    `L ${widthMm - fi} ${heightMm - knee}`,
    `A ${r} ${r} 0 0 0 ${widthMm - knee} ${heightMm - fi}`,
    `L ${knee} ${heightMm - fi}`,
    `A ${r} ${r} 0 0 0 ${fi} ${heightMm - knee}`,
    `L ${fi} ${knee}`,
    `A ${r} ${r} 0 0 0 ${knee} ${fi}`,
    `Z`,
  ].join(" ");
}

/**
 * Bouwt het SVG-pad voor de kaderlijn van een OVAAL bordje (toegevoegd
 * 28-8-2026, n.a.v. een voorbeeldfoto van Christiaan van een ovaal bordje
 * "No 4" met een dunne ovale sierrand rond de gaatjes).
 *
 * In tegenstelling tot de rechthoekige kaderlijn hierboven is hier GEEN
 * inkeping bij de schroefjes nodig. Bij een ovaal bordje zitten de
 * schroefjes op OVAL_SCREW_AXIS_RATIO (28-8-2026: 44%, was 40%) van het
 * midden op de lange as (zie getScrewPositions) — dus op 88% van de
 * afstand tot de ware rand. Een kaderlijn die (met dezelfde
 * FRAME_EDGE_INSET_RATIO als bij de rechthoekige vorm) maar 3% van de
 * kortste zijde naar binnen ligt, blijft daar nog steeds buiten. Dit is
 * bij 44% opnieuw gecontroleerd voor alle 5 bestaande ovale maten
 * (105×150 t/m 220×300 mm): de marge tussen kaderlijn en schroefje is in
 * alle gevallen minimaal ~3,5 mm (bij de grootste maat ruim 6 mm) — dus
 * niet ertegenaan of eroverheen, maar wel merkbaar krapper dan bij de
 * oorspronkelijke 40%. Een gewone, gelijkmatig naar binnen geplaatste
 * ellips volstaat dus nog steeds — precies zoals op Christiaans foto, die
 * geen inkeping bij de gaatjes laat zien.
 *
 * De ellips wordt hier als SVG-pad (met twee boogsegmenten) opgebouwd in
 * plaats van als los <ellipse>-element, omdat het pad-formaat (met "A"-boog-
 * commando's) al bewezen goed werkt bij zowel de live preview
 * (ProductPreview.tsx, gewone SVG in de browser) als de e-mailafbeelding
 * (plate-preview-image.tsx, gerenderd via next/og / Satori) — zie
 * getFrameBorderPath hierboven, die op dezelfde manier werkt.
 */
export function getOvalFrameBorderPath(
  widthMm: number,
  heightMm: number
): string {
  const fi = Math.min(widthMm, heightMm) * FRAME_EDGE_INSET_RATIO;
  const cx = widthMm / 2;
  const cy = heightMm / 2;
  const rx = widthMm / 2 - fi;
  const ry = heightMm / 2 - fi;

  return [
    `M ${cx - rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}`,
    `A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`,
    `Z`,
  ].join(" ");
}

// Verhouding tussen de regelafstand (marge boven een regel) en de
// fontgrootte van de regel erboven — verschilt per lettertype omdat het
// "leeg oogverticaal ruimte"-gevoel van een schreefletter anders is dan bij
// een strak, condensed lettertype.
//
// Deze 5 waarden (huidige volledige lettertypelijst, zie
// config/product-options.ts) zijn een eerste, beredeneerde inschatting —
// blackletter/hoog-contrast-schreefletter → ruim, geometrische stencil-/
// condensed letter → krap — nog NIET visueel gecontroleerd in de
// configurator. Dit is de eerste plek om bij te stellen als de
// regelafstand bij één van deze in de praktijk niet goed oogt. (De 4
// eerdere waarden voor de op 28-8-2026 wéér verwijderde lettertypes
// classic/elegant/modern/industrial zijn met die lettertypes meeverwijderd.)
export const LINE_GAP_RATIO_BY_FONT: Record<string, number> = {
  "fette-fraktur": 0.2,
  bodoni: 0.16,
  colonel: 0.06,
  times: 0.1,
  "schwitserland-schmal": 0.06,
};
export const DEFAULT_LINE_GAP_RATIO = 0.08;
