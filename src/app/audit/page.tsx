import UrlAuditForm from '@/components/UrlAuditForm'

/**
 * /audit page — a dedicated URL for running an audit.
 * The inline results display via UrlAuditForm after the audit completes.
 */
export default function AuditPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-20 max-sm:py-12">
      <div className="w-full max-w-3xl">
        <h1 className="font-serif text-3xl text-ink mb-2">Run an audit</h1>
        <p className="text-muted text-sm mb-8">
          Enter a URL to check its performance, accessibility, best practices, and SEO.
        </p>
        <UrlAuditForm />
      </div>
    </main>
  )
}
