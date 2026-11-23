import type { MetadataRoute } from "next";

/**
 * B11 (testrapport 22-11-2026): robots.txt ontbrak (gaf 404).
 *
 * - Live (Vercel Production): zoekmachines mogen alles behalve de
 *   API-adressen en de bedankpagina, en krijgen het adres van de sitemap.
 * - Testomgeving/Preview: niets laten indexeren.
 *
 * Het adres komt uit SITE_URL (zelfde als app/sitemap.ts); na de overstap
 * naar het eigen domein klopt het dus vanzelf zodra SITE_URL is aangepast.
 */
const SITE_URL = (
  process.env.SITE_URL ?? "https://huisnummerbordje.vercel.app"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/bestelling/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
