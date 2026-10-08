import type { Metadata } from "next";
import { DM_Mono, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geometric = Space_Grotesk({ variable: "--font-geometric", subsets: ["latin"] });
const instrument = DM_Mono({ variable: "--font-instrument", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Vitals — SEO Audit Tool", template: "%s | Vitals" },
  description: "A calm, calibrated first-pass SEO audit instrument.",
  icons: { icon: "/favicon.ico" },
};

import Navigation from "@/components/Navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geometric.variable} ${instrument.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={<nav className="vitals-nav sticky top-0 z-50" />}>
          <Navigation />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-[#AEB4BA] bg-[#202226] py-5 text-center text-[9px] font-mono tracking-[.08em] text-[#858C92]">
          <p>VITALS &mdash; A QUIET SEO INSTRUMENT FOR LOUDER SIGNALS.</p>
          <p className="mt-2 normal-case tracking-normal">Earth model by Zoe XR via <a href="https://poly.pizza/m/3U-XAIY031u" className="underline underline-offset-2">Poly Pizza</a>, licensed under <a href="https://creativecommons.org/licenses/by/3.0/" className="underline underline-offset-2">CC BY 3.0</a>.</p>
        </footer>
      </body>
    </html>
  );
}
