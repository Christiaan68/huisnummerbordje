/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage public bucket hostname, bv. xxxxx.supabase.co
        hostname: "*.supabase.co",
      },
    ],
  },
  // Toegevoegd 9-9-2026, n.a.v. een vraag van Christiaan aan Mollie's
  // support-chat over het terugnavigeren (browser-terugknop) na het
  // betalen: Mollie heeft daar zelf geen instelling voor — het risico zit
  // in ONZE eigen pagina's, niet bij Mollie. Zonder deze headers kan de
  // browser de "Controle"-stap (met de "Doorgaan naar betalen"-knop) uit
  // zijn cache/terug-cache (bfcache) tonen na terugnavigeren, wat een
  // klant zou kunnen laten denken dat hij nog een keer moet/kan betalen
  // voor dezelfde bestelling. "no-store" voorkomt zowel gewone caching als
  // (in alle huidige browsers) dat de pagina in de bfcache belandt — zie
  // ook de "pageshow"-check in app/configurator/controle/page.tsx als
  // extra vangnet.
  async headers() {
    return [
      {
        source: "/configurator/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/bestelling/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
