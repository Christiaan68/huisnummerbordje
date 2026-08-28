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

export const SCREW_INSET_RATIO = 0.11;
export const OVAL_SCREW_AXIS_RATIO = 0.4;

// Placeholder-verhouding (breedte/hoogte) voor een ovaal bordje zolang er
// nog geen maat gekozen is — zie ProductPreview.tsx voor de toelichting.
export const DEFAULT_OVAL_RATIO = 1.4;

const SCREW_RADIUS_RATIO = 0.045; // van min(breedte, hoogte) van het bordje
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
// hoogte) — bewust klein, want de kaderlijn moet duidelijk dichter bij de
// rand lopen dan de schroefjes (die op 11% van de rand zitten).
const FRAME_EDGE_INSET_RATIO = 0.03;

// Extra marge rond het schroefje (als veelvoud van de schroefstraal) die de
// hoekboog minimaal moet vrijhouden, bovenop de schroefstraal zelf.
const FRAME_CORNER_MARGIN_TO_SCREW_RATIO = 0.5;

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

  // Straal van de hoekboog, gemeten vanaf de bordjeshoek zelf: minimaal de
  // afstand tot het schroefje plus zijn straal plus een marge, zodat het
  // schroefje ruim binnen de boog (dus buiten het kader) blijft staan. Door
  // de symmetrische plaatsing van de schroefjes (zie getScrewPositions) is
  // die afstand voor alle 4 hoeken gelijk.
  const cornerToScrewDist = SCREW_INSET_RATIO * Math.hypot(widthMm, heightMm);
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
 * schroefjes op OVAL_SCREW_AXIS_RATIO (40%) van het midden op de lange as
 * (zie getScrewPositions) — dus op 80% van de afstand tot de ware rand. Een
 * kaderlijn die (met dezelfde FRAME_EDGE_INSET_RATIO als bij de
 * rechthoekige vorm) maar 3% van de kortste zijde naar binnen ligt, blijft
 * daar ruim buiten. Dit is gecontroleerd voor alle 5 bestaande ovale maten
 * (105×150 t/m 220×300 mm): de marge tussen kaderlijn en schroefje is in
 * alle gevallen ruim voldoende (circa 7 tot 13,5 mm). Een gewone, gelijkmatig
 * naar binnen geplaatste ellips volstaat dus — precies zoals op Christiaans
 * foto, die geen inkeping bij de gaatjes laat zien.
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
// "leeg oogverticaal ruimte"-gevoel van een schreefletter (Klassiek/Elegant)
// anders is dan bij een strak, condensed lettertype (Modern/Industrieel).
export const LINE_GAP_RATIO_BY_FONT: Record<string, number> = {
  classic: 0.16,
  elegant: 0.16,
  modern: 0.06,
  industrial: 0.06,
};
export const DEFAULT_LINE_GAP_RATIO = 0.08;
