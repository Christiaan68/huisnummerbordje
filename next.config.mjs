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
};

export default nextConfig;
