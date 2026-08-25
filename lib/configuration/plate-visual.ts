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
// n.a.v. voorbeeldfoto van Christiaan). Alleen voor rechthoekige vormen
// (niet "ovaal" — besloten door Christiaan, 25-8-2026).
//
// Dit pad is 4x herzien op basis van Christiaans feedback en foto's van een
// echt bordje, voordat de vorm klopte:
//   1) Een rechte, afgeschuinde hoek ("chamfer") per hoek — liep dwars door
//      het schroefje heen.
//   2) Een boog exact rond het schroefje — maar aan de verkeerde (buiten)kant,
//      waardoor het schroefje BINNEN het kader kwam te staan i.p.v. erbuiten.
//   3) Dezelfde boog, nu aan de juiste kant, maar met de rechte stukken vlak
//      langs het schroefje (i.p.v. langs de bordjesrand) en een boogstraal
//      die maar nauwelijks groter was dan het schroefje zelf — Christiaan gaf
//      aan dat de rechte stukken al goed liepen tot aan het schroefje, maar
//      dat het kader daar te krap om het schroefje boog i.p.v. er ruim
//      omheen.
//   4) (huidige versie) Op basis van twee scherpe close-up foto's van een
//      echt schroefje bleek het kader helemaal geen boog te zijn die om het
//      schroefje "getekend" is: het is een gewone, sierlijke afgeronde hoek
//      (zoals een rounded rectangle) die vlak langs de bordjesrand loopt —
//      dus duidelijk BUITEN (dichter bij de rand dan) de schroefjes — en pas
//      bij de hoek zelf een ruime boog maakt. Omdat die hoek ruimer is dan de
//      afstand van de kaderlijn tot het schroefje, komt het schroefje
//      vanzelf in het hoekige "zakje" tussen kaderboog en bordjeshoek te
//      staan — precies zoals Christiaan beschreef ("het kader zit buiten de
//      schroefjes, behalve bij de schroefjes, daar gaat die in dezelfde
//      ronding binnen om weer naar de buitenste kaderlijn").
export const FRAME_STROKE_WIDTH_RATIO = 0.014; // lijndikte, t.o.v. min(breedte, hoogte)

// Afstand van de rechte kaderlijn tot de bordjesrand, t.o.v. min(breedte,
// hoogte) — bewust klein, want de kaderlijn moet duidelijk dichter bij de
// rand lopen dan de schroefjes (die op 11% van de rand zitten).
const FRAME_EDGE_INSET_RATIO = 0.025;

// Hoe ruim de hoekboog is, als veelvoud van de afstand tussen de kaderlijn
// en het schroefje. >1 zorgt ervoor dat de boog voorbij het schroefje reikt
// (zodat die duidelijk zichtbaar naar binnen buigt), zonder het schroefje te
// raken — geverifieerd voor alle bordjesmaten uit config/product-options.ts,
// inclusief de "platste" (210×105mm) en "hoogste" (200×250mm) varianten.
const FRAME_CORNER_RADIUS_FACTOR = 1.3;

// Veiligheidsmarge (mm) zodat de hoekboog nooit groter wordt dan de helft
// van een zijde (anders zouden twee hoekbogen elkaar overlappen).
const FRAME_CORNER_RADIUS_SAFETY_MARGIN_MM = 1;

/**
 * Bouwt het SVG-pad voor de kaderlijn, in dezelfde mm-coördinaten als de
 * rest van de bordjestekening. De lijn loopt vlak langs de rand van het
 * bordje (dus buiten de schroefjes) en maakt bij elke hoek één ruime,
 * sierlijke boog naar binnen en weer terug — groot genoeg om het schroefje
 * in die hoek vrij te laten, zoals op Christiaans foto's van een echt
 * bordje. Wordt gebruikt door zowel de live preview (ProductPreview.tsx) als
 * de voorbeeldafbeelding in de bevestigingsmail (plate-preview-image.tsx) —
 * zie de toelichting bovenaan dit bestand over waarom dit soort logica op
 * één plek hoort te staan.
 */
export function getFrameBorderPath(widthMm: number, heightMm: number): string {
  const minDim = Math.min(widthMm, heightMm);
  const frameInset = minDim * FRAME_EDGE_INSET_RATIO;

  // Door de symmetrische plaatsing van de schroefjes (zie getScrewPositions)
  // is de afstand tussen kaderlijn en schroefje voor alle 4 hoeken gelijk —
  // dus ook de hoekboog is voor alle 4 hoeken even groot.
  const gapX = widthMm * SCREW_INSET_RATIO - frameInset;
  const gapY = heightMm * SCREW_INSET_RATIO - frameInset;

  const rx = Math.min(
    gapX * FRAME_CORNER_RADIUS_FACTOR,
    widthMm / 2 - frameInset - FRAME_CORNER_RADIUS_SAFETY_MARGIN_MM
  );
  const ry = Math.min(
    gapY * FRAME_CORNER_RADIUS_FACTOR,
    heightMm / 2 - frameInset - FRAME_CORNER_RADIUS_SAFETY_MARGIN_MM
  );

  const fi = frameInset;
  return [
    `M ${fi + rx} ${fi}`,
    `L ${widthMm - fi - rx} ${fi}`,
    `A ${rx} ${ry} 0 0 1 ${widthMm - fi} ${fi + ry}`,
    `L ${widthMm - fi} ${heightMm - fi - ry}`,
    `A ${rx} ${ry} 0 0 1 ${widthMm - fi - rx} ${heightMm - fi}`,
    `L ${fi + rx} ${heightMm - fi}`,
    `A ${rx} ${ry} 0 0 1 ${fi} ${heightMm - fi - ry}`,
    `L ${fi} ${fi + ry}`,
    `A ${rx} ${ry} 0 0 1 ${fi + rx} ${fi}`,
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
