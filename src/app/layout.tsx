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

import Navigation from "@/components/Navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geometric.variable} ${instrument.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-[#AEB4BA] bg-[#202226] py-5 text-center text-[9px] font-mono tracking-[.08em] text-[#858C92]">
          <p>VITALS &mdash; A QUIET SEO INSTRUMENT FOR LOUDER SIGNALS.</p>
        </footer>
      </body>
    </html>
  );
}
