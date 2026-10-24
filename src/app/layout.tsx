import type { Metadata } from "next";
import { Suspense } from "react";
import { TikTok_Sans } from "next/font/google";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { Motion } from "@/components/shop/Motion";
import { getCatalog } from "@/server/catalog";
import "./globals.css";

// Self-hosted at build time. One variable family: wide and heavy for display, normal
// width for reading.
const sans = TikTok_Sans({ variable: "--font-tiktok", subsets: ["latin"], axes: ["wdth"] });

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
    <html lang="en" className={sans.variable}>
      <body className="antialiased">
        <Suspense fallback={<div className="h-16" />}>
          <Header />
        </Suspense>
        {children}
        <Motion />
        <Footer storeCount={catalog.sources.length} takenAt={catalog.takenAt} />
      </body>
    </html>
  );
}
