/**
 * Centrale plek voor homepage-inhoud. Wordt in FASE 2 gebruikt.
 * Later eenvoudig te vervangen door een echte CMS-koppeling.
 */
export const siteContent = {
  hero: {
    backgroundImage: "/images/hero-background.jpg",
    title: "Duurzaam. Opvallend. Authentiek.",
    intro:
      "Een geëmailleerd huisnummerbordje is gemaakt om jarenlang mee te gaan. Emaille is sterk, duurzaam en bestand tegen weer en wind. De karakteristieke uitstraling maakt ieder bordje uniek en geeft jouw woning een authentiek en opvallend detail.",
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
