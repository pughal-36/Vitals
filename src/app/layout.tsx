import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navigation from "@/components/Navigation";

const bodoni = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#303A5E",
};

export const metadata: Metadata = {
  title: { default: "Vitals — SEO Audit Tool", template: "%s | Vitals" },
  description: "A clear first look at your site's Web Vitals and SEO signals.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bodoni.variable}>
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header role="banner">
          <Suspense fallback={<nav className="vitals-nav sticky top-0 z-50" aria-label="Main navigation" />}>
            <Navigation />
          </Suspense>
        </header>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="vitals-footer border-t border-navy-deep bg-navy py-6 text-center text-xs text-white/80" role="contentinfo">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
            <span>Vitals &copy; {new Date().getFullYear()} &mdash; Web Vitals &amp; SEO Performance Tool</span>
            <div className="flex items-center gap-4">
              <a href="/about" className="hover:text-yellow underline underline-offset-4">About</a>
              <a href="https://github.com/pughal-36/Vitals" target="_blank" rel="noopener noreferrer" className="hover:text-yellow underline underline-offset-4">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
