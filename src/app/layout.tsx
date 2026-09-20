import type { Metadata } from 'next'
import './globals.css'
import { serif, sans, hand } from '@/lib/fonts'
import { Providers } from '@/components/Providers'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: 'Vitals — Web Performance & SEO Audit',
    template: '%s | Vitals',
  },
  description:
    "Audit any website's Core Web Vitals and PageSpeed score instantly.",
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Vitals — Web Performance & SEO Audit',
    description: "Audit any website's Core Web Vitals and PageSpeed score instantly.",
    type: 'website',
  },
}

const navLinks = [
  { href: '/',        label: 'Home'    },
  { href: '/history', label: 'History' },
  { href: '/compare', label: 'Compare' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${hand.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-paper text-ink font-sans">
        <Providers>
          {/* Hidden wobble SVG filter for sketch frames */}
          <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
            <filter id="wobble">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>
            </filter>
          </svg>

          {/* ─── Navigation ─── */}
          <header>
            <nav className="border-b border-line" aria-label="Main navigation">
              <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-14">

                {/* Logo: "Vitals" in serif with bolt icon */}
                <Link href="/" className="flex items-center gap-2" id="nav-logo">
                  <svg
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span className="text-xl font-serif text-ink">Vitals</span>
                </Link>

                {/* Desktop nav links */}
                <ul className="hidden sm:flex items-center gap-6" role="list">
                  {navLinks.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        id={`nav-${label.toLowerCase()}`}
                        className="text-sm text-muted hover:text-ink underline-offset-4 hover:underline transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Right side: theme toggle + mobile links */}
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  {/* Mobile: abbreviated links */}
                  <ul className="flex sm:hidden items-center gap-4" role="list">
                    {navLinks.map(({ href, label }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          id={`nav-mob-${label.toLowerCase()}`}
                          className="text-sm text-muted hover:text-ink transition-colors"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </nav>
          </header>

          {/* ─── Main Content ─── */}
          <div className="flex-1 flex flex-col">{children}</div>

          {/* ─── Footer ─── */}
          <footer className="border-t border-line py-6 text-center text-sm text-muted">
            <p>Vitals &mdash; Built with Next.js &amp; Tailwind</p>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
