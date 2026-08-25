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
// n.a.v. voorbeeldfoto van Christiaan). Een dunne, verder rechte lijn die
// vlak langs de rand van het bordje loopt, en die alleen vlak bij elk
// schroefje een klein stukje naar binnen (richting het midden van het
// bordje) buigt in een kwartcirkel — precies rakend aan de binnenkant van
// het schroefje. Het schroefje zelf blijft dus grotendeels BUITEN het
// kader staan (in de hoek, tussen kaderlijn en bordjesrand), zoals op de
// voorbeeldfoto. Alleen voor rechthoekige vormen (niet "ovaal" — besloten
// door Christiaan, 25-8-2026).
//
// Update 25-8-2026 (later): de eerste versie van dit pad gebruikte een
// rechte, afgeschuinde hoek ("chamfer") bij elke hoek, die (rekenkundig
// vastgesteld) dwars door het schroefje heen liep in plaats van eromheen.
// Vervangen door een boog exact rond elk schroefje — maar die tweede versie
// liet de boog nog aan de VERKEERDE (buiten)kant van elk schroefje lopen,
// waardoor het schroefje binnen het kader kwam te staan i.p.v. erbuiten.
// Nu gecorrigeerd: de boog buigt om de kant van het schroefje die richting
// het midden van het bordje wijst, zodat het schroefje aan de buitenkant
// (in de hoek) blijft staan, zoals op de foto — geverifieerd door de
// daadwerkelijke SVG in een browser te renderen en te vergelijken.
export const FRAME_STROKE_WIDTH_RATIO = 0.014; // lijndikte, t.o.v. min(breedte, hoogte)

/**
 * Bouwt het SVG-pad voor de kaderlijn, in dezelfde mm-coördinaten als de
 * rest van de bordjestekening. De lijn loopt vlak langs de rand en buigt
 * vlak bij elke hoek een klein stukje naar binnen, in een kwartcirkel
 * (straal = schroefstraal + halve lijndikte) om de binnenkant van het
 * schroefje heen, zodat het schroefje aan de buitenkant van het kader in de
 * hoek blijft staan. Wordt gebruikt door zowel de live preview
 * (ProductPreview.tsx) als de voorbeeldafbeelding in de bevestigingsmail
 * (plate-preview-image.tsx) — zie de toelichting bovenaan dit bestand over
 * waarom dit soort logica op één plek hoort te staan.
 */
export function getFrameBorderPath(widthMm: number, heightMm: number): string {
  const screwRadius = getScrewRadiusMm(widthMm, heightMm);
  const strokeWidth = Math.min(widthMm, heightMm) * FRAME_STROKE_WIDTH_RATIO;
  // Straal van de boog om elk schroefje: zo groot dat de kaderlijn het
  // schroefje precies raakt (rakend, niet erdoorheen) — de lijn zelf heeft
  // ook dikte, dus de boog moet een halve lijndikte extra ruimte houden.
  const r = screwRadius + strokeWidth / 2;

  const screwX1 = widthMm * SCREW_INSET_RATIO; // linker schroefjes
  const screwX2 = widthMm * (1 - SCREW_INSET_RATIO); // rechter schroefjes
  const screwY1 = heightMm * SCREW_INSET_RATIO; // bovenste schroefjes
  const screwY2 = heightMm * (1 - SCREW_INSET_RATIO); // onderste schroefjes

  // De rechte lijnstukken lopen aan de MIDDEN-kant van elk schroefje (dus
  // verder van de bordjesrand af dan het schroefje) — het schroefje blijft
  // zo in de hoek staan, buiten het kader.
  const topY = screwY1 + r;
  const bottomY = screwY2 - r;
  const leftX = screwX1 + r;
  const rightX = screwX2 - r;

  // Elke "A"-boog is een kwartcirkel (straal r) die rakend aansluit op de
  // rechte lijnstukken ervoor en erna, en buigt om de kant van het
  // schroefje die richting het midden van het bordje wijst.
  return [
    `M ${screwX1} ${topY}`,
    `L ${screwX2} ${topY}`,
    `A ${r} ${r} 0 0 1 ${rightX} ${screwY1}`,
    `L ${rightX} ${screwY2}`,
    `A ${r} ${r} 0 0 1 ${screwX2} ${bottomY}`,
    `L ${screwX1} ${bottomY}`,
    `A ${r} ${r} 0 0 1 ${leftX} ${screwY2}`,
    `L ${leftX} ${screwY1}`,
    `A ${r} ${r} 0 0 1 ${screwX1} ${topY}`,
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
