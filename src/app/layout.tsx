import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navigation from "@/components/Navigation";

const bodoni = Bodoni_Moda({ variable: "--font-display", subsets: ["latin"], weight: ["800"] });

export const metadata: Metadata = {
  title: { default: "Vitals — SEO Audit Tool", template: "%s | Vitals" },
  description: "A clear first look at your site's Web Vitals and SEO signals.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bodoni.variable}>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={<nav className="vitals-nav sticky top-0 z-50" aria-label="Main navigation" />}>
          <Navigation />
        </Suspense>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="vitals-footer border-t py-5 text-center text-sm">
          <p>Vitals — website signals, made easier to read.</p>
          <p className="mt-2 text-xs">Earth model by Zoe XR via <a href="https://poly.pizza/m/3U-XAIY031u" className="underline underline-offset-2">Poly Pizza</a>, under <a href="https://poly.pizza/docs/tos" className="underline underline-offset-2">Creative Commons Attribution (version not stated on the listing)</a>.</p>
        </footer>
      </body>
    </html>
  );
}
