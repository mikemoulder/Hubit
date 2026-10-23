import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { getCatalog } from "@/server/catalog";
import "./globals.css";

// Self-hosted at build time, so the demo never waits on a font CDN over venue wifi.
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hubit-store.vercel.app"),
  title: { default: "Hubit", template: "%s · Hubit" },
  description:
    "One shop over 28 independent stores, for you and your AI agent together. One cart, one payment; Hubit sources each item from the store that has it.",
  openGraph: {
    title: "Hubit",
    description: "One shop over 28 independent stores, for you and your AI agent together.",
    type: "website",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = getCatalog();
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Suspense fallback={<div className="h-[105px] border-b border-[var(--color-border)]" />}>
          <Header />
        </Suspense>
        {children}
        <Footer storeCount={catalog.sources.length} takenAt={catalog.takenAt} />
      </body>
    </html>
  );
}
