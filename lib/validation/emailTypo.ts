/**
 * Typfout-controle voor e-mailadressen (toegevoegd 26-11-2026, besluit
 * Christiaan): herkent veelgemaakte fouten in het deel na de @ (bv.
 * "gmail.vom", "gmial.com", "hotmial.nl", "outlook.con") en stelt de
 * vermoedelijk bedoelde schrijfwijze voor. Het is alleen een suggestie in het
 * formulier — er wordt nooit iets automatisch aangepast of geblokkeerd.
 */
const KNOWN_DOMAINS = [
  "gmail.com", "hotmail.com", "hotmail.nl", "outlook.com", "outlook.nl", "live.nl", "live.com",
  "icloud.com", "me.com", "msn.com", "yahoo.com", "ziggo.nl", "kpnmail.nl", "kpnplanet.nl",
  "planet.nl", "home.nl", "xs4all.nl", "upcmail.nl", "chello.nl", "hetnet.nl", "telfort.nl",
  "zeelandnet.nl", "caiway.nl", "solcon.nl", "online.nl", "quicknet.nl",
];

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

/** Geeft het vermoedelijk bedoelde e-mailadres, of null als er niets opvalt. */
export function suggestEmailCorrection(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  const local = email.trim().slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (KNOWN_DOMAINS.includes(domain)) return null;

  // 1. Lijkt sterk op een bekend domein (1 of 2 tekens verschil).
  let best: string | null = null;
  let bestDist = 3;
  for (const known of KNOWN_DOMAINS) {
    const d = distance(domain, known);
    if (d < bestDist) {
      bestDist = d;
      best = known;
    }
  }
  if (best && bestDist <= 2) return `${local}@${best}`;

  // 2. Alleen de extensie lijkt verkeerd getypt (bv. "bedrijf.vom").
  const dot = domain.lastIndexOf(".");
  if (dot > 0) {
    const fixed = TLD_FIXES[domain.slice(dot + 1)];
    if (fixed) return `${local}@${domain.slice(0, dot)}.${fixed}`;
  }
  return null;
}
