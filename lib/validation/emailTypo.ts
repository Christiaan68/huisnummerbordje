/**
 * Typfout-controle voor e-mailadressen (toegevoegd 26-11-2026, besluit
 * Christiaan): herkent veelgemaakte fouten in het deel na de @ (bv.
 * "gmail.vom", "gmial.com", "gmaim.nl", "hotmial.nl", "outlook.con") en stelt
 * de vermoedelijk bedoelde schrijfwijze voor. Het is alleen een suggestie in
 * het formulier — er wordt nooit iets automatisch aangepast of geblokkeerd.
 */

// Grote mailaanbieders: naam vóór de punt → de domeinen die echt bestaan.
// Het eerste domein is de standaard als de extensie niet bij de aanbieder past
// (bv. "gmail.nl" bestaat niet als mailadres → "gmail.com").
const PROVIDERS: Record<string, string[]> = {
  gmail: ["gmail.com"],
  googlemail: ["googlemail.com"],
  hotmail: ["hotmail.com", "hotmail.nl", "hotmail.de", "hotmail.be"],
  outlook: ["outlook.com", "outlook.nl", "outlook.de", "outlook.be"],
  icloud: ["icloud.com"],
  yahoo: ["yahoo.com", "yahoo.de"],
  ziggo: ["ziggo.nl"],
  kpnmail: ["kpnmail.nl"],
  kpnplanet: ["kpnplanet.nl"],
  planet: ["planet.nl"],
  xs4all: ["xs4all.nl"],
  upcmail: ["upcmail.nl"],
  chello: ["chello.nl"],
  hetnet: ["hetnet.nl"],
  telfort: ["telfort.nl"],
  zeelandnet: ["zeelandnet.nl"],
  caiway: ["caiway.nl"],
  solcon: ["solcon.nl"],
  online: ["online.nl", "online.de"],
  quicknet: ["quicknet.nl"],
  freenet: ["freenet.de"],
  t_online: ["t-online.de"],
  telenet: ["telenet.be"],
  skynet: ["skynet.be"],
  protonmail: ["protonmail.com"],
};

// Overige bekende domeinen die we nooit als typfout zien.
const OTHER_KNOWN = [
  "live.nl", "live.com", "live.de", "live.be", "me.com", "msn.com", "home.nl",
  "gmx.de", "gmx.net", "gmx.com", "web.de", "arcor.de", "proton.me", "mail.com",
];

const KNOWN_DOMAINS = [...Object.values(PROVIDERS).flat(), ...OTHER_KNOWN];

// Veelvoorkomende typfouten in de extensie, alleen voor .com en .nl.
const TLD_FIXES: Record<string, string> = {
  vom: "com", cim: "com", con: "com", cpm: "com", xom: "com", ocm: "com", cmo: "com", comm: "com", coom: "com",
  nll: "nl", nk: "nl", nl1: "nl",
};

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
}

/** Hoeveel tekens verschil we bij een naam van deze lengte nog als typfout zien. */
function allowedDistance(length: number): number {
  if (length >= 9) return 2;
  if (length >= 5) return 1;
  return 0; // korte namen (gmx, web, live) alleen bij exacte overeenkomst
}

/** Geeft het vermoedelijk bedoelde e-mailadres, of null als er niets opvalt. */
export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  const local = email.trim().slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (KNOWN_DOMAINS.includes(domain)) return null;

  const dot = domain.lastIndexOf(".");
  const label = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot + 1) : "";
  const fixedTld = TLD_FIXES[tld] ?? tld;

  // 1. De naam lijkt op een grote mailaanbieder (bv. "gmaim.nl", "gmail.nl",
  //    "hotmial.nl"): stel het echte domein van die aanbieder voor, met dezelfde
  //    extensie als die bij de aanbieder bestaat.
  let bestProvider: string | null = null;
  let bestDist = Infinity;
  for (const name of Object.keys(PROVIDERS)) {
    const providerLabel = PROVIDERS[name][0].slice(0, PROVIDERS[name][0].lastIndexOf("."));
    const d = distance(label, providerLabel);
    if (d <= allowedDistance(providerLabel.length) && d < bestDist) {
      bestDist = d;
      bestProvider = name;
    }
  }
  if (bestProvider) {
    const domains = PROVIDERS[bestProvider];
    const sameTld = domains.find((d) => d.endsWith(`.${fixedTld}`));
    return `${local}@${sameTld ?? domains[0]}`;
  }

  // 2. Het hele domein lijkt sterk op een ander bekend domein.
  let best: string | null = null;
  let bestWhole = Infinity;
  for (const known of OTHER_KNOWN) {
    const d = distance(domain, known);
    const knownLabelLength = known.lastIndexOf(".");
    if (d <= allowedDistance(knownLabelLength) && d < bestWhole) {
      bestWhole = d;
      best = known;
    }
  }
  if (best) return `${local}@${best}`;

  // 3. Alleen de extensie lijkt verkeerd getypt (bv. "bedrijf.vom").
  if (dot > 0 && fixedTld !== tld) return `${local}@${label}.${fixedTld}`;
  return null;
}
