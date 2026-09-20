import UrlAuditForm from '@/components/UrlAuditForm'
import { FeatureRow, Band } from '@/components/LandingSections'

/** Placeholder box used until SVG illustrations are converted (step 7) */
function IllustrationPlaceholder({ filename, className = '' }: { filename: string; className?: string }) {
  return (
    <div
      className={`bg-card border border-line rounded-2xl flex items-center justify-center text-muted text-xs ${className}`}
      aria-hidden="true"
    >
      {filename}
    </div>
  )
}

const FEATURES = [
  {
    illustrationSlot: <IllustrationPlaceholder filename="feature-performance.svg" className="w-24 h-24" />,
    title: 'Performance',
    body: 'Real Lighthouse scores for load time, interactivity and visual stability.',
  },
  {
    illustrationSlot: <IllustrationPlaceholder filename="feature-seo.svg" className="w-24 h-24" />,
    title: 'SEO',
    body: 'See how easily search engines can crawl and index your pages.',
  },
  {
    illustrationSlot: <IllustrationPlaceholder filename="feature-accessibility.svg" className="w-24 h-24" />,
    title: 'Accessibility',
    body: 'Check whether your site works for everyone, including assistive technology users.',
  },
  {
    illustrationSlot: <IllustrationPlaceholder filename="feature-ai.svg" className="w-24 h-24" />,
    title: 'AI explanations',
    body: 'Ask Gemini to explain any score or suggest fixes in plain language.',
  },
]

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ─── Hero ─── */}
      <section
        className="mx-auto max-w-6xl px-6 py-20 max-sm:py-12 flex flex-col sm:flex-row items-center gap-12"
        id="hero"
        aria-labelledby="hero-heading"
      >
        {/* Left: heading + subtitle + form */}
        <div className="flex-1 min-w-0">
          <h1
            id="hero-heading"
            className="font-serif text-5xl max-sm:text-4xl text-ink leading-[1.1] mb-4"
          >
            Audit your site&apos;s <em>Web Vitals</em>
          </h1>
          <p className="text-base text-ink leading-relaxed max-w-[65ch] mb-8">
            Paste a URL to get performance, accessibility, best-practices and SEO scores.
          </p>
          <UrlAuditForm />
        </div>

        {/* Right: hero illustration placeholder */}
        <IllustrationPlaceholder filename="hero.svg" className="hidden sm:flex w-72 h-72 shrink-0" />
      </section>

      {/* ─── Feature Row ─── */}
      <section
        className="mx-auto max-w-6xl px-6 py-20 max-sm:py-12"
        aria-label="Features"
      >
        <FeatureRow items={FEATURES} />
      </section>

      {/* ─── Band CTA ─── */}
      <Band
        heading={<>Run your first <em>audit</em></>}
        body="Paste any URL above and get a full breakdown in under 30 seconds. No account needed."
        illustrationSlot={<IllustrationPlaceholder filename="hero.svg" className="w-full h-full" />}
      />
    </main>
  )
}
