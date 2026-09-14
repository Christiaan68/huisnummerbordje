/**
 * Centrale plek voor homepage-inhoud. Wordt in FASE 2 gebruikt.
 * Later eenvoudig te vervangen door een echte CMS-koppeling.
 */
export const siteContent = {
  hero: {
    backgroundImage: "/images/hero-background.jpg",
    // Nieuwe hero-tekst, aangeleverd door Christiaan (14-9-2026): een
    // korte inleidende zin boven de titel ("eyebrow"), de titel zelf
    // (ongewijzigd) en een nieuwe tekst eronder — zie app/page.tsx voor
    // hoe deze drie elementen samen worden getoond.
    eyebrow:
      "Een huis met karakter verdient een huisnummer met karakter. Geef jouw entree de finishing touch met een emaille huisnummer dat bij je woning past.",
    title: "Duurzaam. Opvallend. Authentiek.",
    intro:
      "Diepe glans, een karakteristieke uitstraling en bestand tegen weer en wind. Stel jouw huisnummerbordje samen en maak het welkom compleet.",
    ctaLabel: "Ontwerp jouw huisnummerbordje",
    ctaHref: "/configurator",
  },
} as const;

/**
 * Bedrijfsgegevens (NAW + KVK/btw + contact) — door Christiaan aangeleverd
 * op 15-8-2026, getoond op /bedrijfsgegevens (link in de footer).
 */
export const companyInfo = {
  name: "Langcat Emaille",
  street: "Professor Stokvislaan 1",
  postalCode: "6957 DJ",
  city: "Laag-Soeren",
  country: "The Netherlands",
  phone: "+31 (0)6 29524467",
  email: "info@langcat.nl",
  kvkNumber: "98200194",
  vatNumber: "NL002830284B08",
} as const;
