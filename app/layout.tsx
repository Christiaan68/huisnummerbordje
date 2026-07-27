import type { Metadata } from "next";
import { Inter, Fraunces, Bebas_Neue, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Geëmailleerde Huisnummerbordjes | Duurzaam. Opvallend. Authentiek.",
  description:
    "Ontwerp jouw eigen gepersonaliseerde geëmailleerde huisnummerbordje. Duurzaam, opvallend en authentiek — gemaakt om jarenlang mee te gaan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} ${fraunces.variable} ${bebasNeue.variable} ${playfairDisplay.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
