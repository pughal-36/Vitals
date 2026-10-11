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
      </body>
    </html>
  );
}
