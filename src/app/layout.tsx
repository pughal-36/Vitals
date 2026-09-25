import type { Metadata } from "next";
import { DM_Mono, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geometric = Space_Grotesk({ variable: "--font-geometric", subsets: ["latin"] });
const instrument = DM_Mono({ variable: "--font-instrument", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Vitals — SEO Audit Tool", template: "%s | Vitals" },
  description: "A calm, calibrated first-pass SEO audit instrument.",
  icons: { icon: "/favicon.ico" },
};

const navLinks = [
  { href: "/", label: "AUDIT" },
  { href: "/results", label: "READOUT" },
  { href: "/chat", label: "ASSISTANT" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geometric.variable} ${instrument.variable}`}>
      <body className="min-h-screen flex flex-col">
        <nav className="vitals-nav sticky top-0 z-50">
          <div className="vitals-nav-inner mx-auto flex items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Vitals home">
              <span className="vitals-logo-mark" aria-hidden="true"><span /></span>
              <span className="vitals-logo-word text-sm">VITALS</span>
              <span className="vitals-logo-tag hidden sm:inline">SEO AUDIT</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className="vitals-nav-link rounded-sm px-3 py-2" data-nav-label={label}>
                  {label}
                </Link>
              ))}
              <span className="hidden sm:flex items-center gap-2 ml-4 text-[9px] font-mono tracking-[.08em] text-[#2B2E33]"><span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" /> SYSTEM ONLINE</span>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-[#AEB4BA] bg-[#202226] py-5 text-center text-[9px] font-mono tracking-[.08em] text-[#858C92]">
          <p>VITALS &mdash; A QUIET SEO INSTRUMENT FOR LOUDER SIGNALS.</p>
        </footer>
      </body>
    </html>
  );
}
