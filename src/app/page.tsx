import UrlAuditForm from '@/components/UrlAuditForm'
import { FeatureRow, Band } from '@/components/LandingSections'
import { Illustration } from '@/components/Illustration'

const FEATURES = [
  {
    illustrationSlot: <Illustration name="feature-performance" width={96} height={96} />,
    title: 'Performance',
    body: 'Real Lighthouse scores for load time, interactivity and visual stability.',
  },
  {
    illustrationSlot: <Illustration name="feature-seo" width={96} height={96} />,
    title: 'SEO',
    body: 'See how easily search engines can crawl and index your pages.',
  },
  {
    illustrationSlot: <Illustration name="feature-accessibility" width={96} height={96} />,
    title: 'Accessibility',
    body: 'Check whether your site works for everyone, including assistive technology users.',
  },
  {
    illustrationSlot: <Illustration name="feature-ai" width={96} height={96} />,
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

        {/* Right: hero illustration */}
        <div className="hidden sm:block w-72 h-72 shrink-0">
          <Illustration name="hero" width={288} height={288} />
        </div>
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
        illustrationSlot={<Illustration name="hero" width="100%" height="100%" />}
      />
    </main>
  )
}
