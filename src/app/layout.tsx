import type { Metadata } from "next";
import { Inter, Urbanist, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], weight: ["600", "700", "800"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: "dStreak",
  description: "Daily streak tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${urbanist.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
