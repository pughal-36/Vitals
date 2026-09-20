import UrlAuditForm from '@/components/UrlAuditForm'

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

        {/* Right: hero illustration placeholder (wired in step 7) */}
        <div
          className="hidden sm:flex items-center justify-center w-72 h-72 rounded-2xl bg-card border border-line shrink-0 text-muted text-sm"
          aria-hidden="true"
        >
          hero.svg
        </div>
      </section>
    </main>
  )
}
