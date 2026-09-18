import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vitals — Web Performance & SEO Audit Dashboard",
    template: "%s | Vitals",
  },
  description:
    "Audit any website's Core Web Vitals and PageSpeed score instantly, then get AI-powered optimisation tips from Gemini.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Vitals — Web Performance & SEO Audit Dashboard",
    description: "Audit any website's Core Web Vitals and PageSpeed score instantly.",
    type: "website",
  },
};

const navLinks = [
  { href: "/", label: "Home", icon: "⚡" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/compare", label: "Compare", icon: "⚖️" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mesh">
        {/* ─── Navigation ─── */}
        <nav className="sticky top-0 z-50 glass border-b border-border/40">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              id="nav-logo"
            >
              <span className="text-2xl" aria-hidden="true">
                ⚡
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                Vitals
              </span>
            </Link>

            {/* Nav Links */}
            <ul className="flex items-center gap-1 sm:gap-2">
              {navLinks.map(({ href, label, icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    id={`nav-${label.toLowerCase()}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200"
                  >
                    <span className="hidden sm:inline" aria-hidden="true">
                      {icon}
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* ─── Footer ─── */}
        <footer className="border-t border-border/40 py-6 text-center text-sm text-muted">
          <p>
            Vitals &mdash; Week 3 Capstone &middot; Built with Next.js,
            Tailwind &amp; Gemini
          </p>
        </footer>
      </body>
    </html>
  );
}
