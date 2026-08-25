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
// n.a.v. voorbeeldfoto van Christiaan). Een dunne lijn, ingesprongen vanaf de
// rand van het bordje, met een afgeschuinde ("chamfered") hoek op elke hoek
// zodat de lijn nooit over een schroefje heen loopt — het schroefje komt
// precies in die afgeschuinde hoek te staan, zoals op de voorbeeldfoto.
// Alleen voor rechthoekige vormen (niet "ovaal" — besloten door Christiaan,
// 25-8-2026).
const FRAME_INSET_RATIO = 0.05; // afstand van de kaderlijn tot de bordjesrand
export const FRAME_STROKE_WIDTH_RATIO = 0.014; // lijndikte, t.o.v. min(breedte, hoogte)

/**
 * Bouwt het SVG-pad (een rechthoek met afgeschuinde hoeken) voor de
 * kaderlijn, in dezelfde mm-coördinaten als de rest van de bordjestekening.
 * Wordt gebruikt door zowel de live preview (ProductPreview.tsx) als de
 * voorbeeldafbeelding in de bevestigingsmail (plate-preview-image.tsx) — zie
 * de toelichting bovenaan dit bestand over waarom dit soort logica op één
 * plek hoort te staan.
 */
export function getFrameBorderPath(widthMm: number, heightMm: number): string {
  const insetX = widthMm * FRAME_INSET_RATIO;
  const insetY = heightMm * FRAME_INSET_RATIO;
  const x = insetX;
  const y = insetY;
  const w = widthMm - insetX * 2;
  const h = heightMm - insetY * 2;

  // De afgeschuinde hoek moet groot genoeg zijn om het schroefje in die hoek
  // te ontwijken — gebaseerd op de werkelijke schroefpositie/-straal
  // (SCREW_INSET_RATIO/getScrewRadiusMm hierboven), zodat het kader nooit
  // over een schroefje heen loopt, op elke maat.
  const screwRadius = getScrewRadiusMm(widthMm, heightMm);
  const chamferX = Math.max(0, widthMm * SCREW_INSET_RATIO - insetX) + screwRadius * 1.6;
  const chamferY = Math.max(0, heightMm * SCREW_INSET_RATIO - insetY) + screwRadius * 1.6;
  const cx = Math.min(chamferX, w / 2 - 1);
  const cy = Math.min(chamferY, h / 2 - 1);

  return [
    `M ${x + cx} ${y}`,
    `L ${x + w - cx} ${y}`,
    `L ${x + w} ${y + cy}`,
    `L ${x + w} ${y + h - cy}`,
    `L ${x + w - cx} ${y + h}`,
    `L ${x + cx} ${y + h}`,
    `L ${x} ${y + h - cy}`,
    `L ${x} ${y + cy}`,
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
