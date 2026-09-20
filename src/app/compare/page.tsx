'use client'

import { useState, type FormEvent } from 'react'
import { PillButton } from '@/components/PillButton'
import { ScoreCard } from '@/components/ScoreCard'
import { EmptyState } from '@/components/EmptyState'
import type { AuditSuccess, AuditResult } from '@/app/api/audit/route'
import type { Metadata } from 'next'

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const CATEGORY_META = [
  { id: 'performance',    key: 'performance'   as const, label: 'Performance'    },
  { id: 'accessibility',  key: 'accessibility' as const, label: 'Accessibility'  },
  { id: 'best-practices', key: 'bestPractices' as const, label: 'Best practices' },
  { id: 'seo',            key: 'seo'           as const, label: 'SEO'            },
]

function getDomain(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

export default function ComparePage() {
  const [urlA, setUrlA] = useState('')
  const [urlB, setUrlB] = useState('')
  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultA, setResultA] = useState<AuditSuccess | null>(null)
  const [resultB, setResultB] = useState<AuditSuccess | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const runAudit = async (url: string): Promise<AuditSuccess | null> => {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data: AuditResult = await res.json()
    return data.ok ? data : null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    let valid = true

    if (!urlA.trim() || !isValidUrl(urlA)) {
      setErrorA('Enter a valid URL.')
      valid = false
    } else setErrorA(null)

    if (!urlB.trim() || !isValidUrl(urlB)) {
      setErrorB('Enter a valid URL.')
      valid = false
    } else setErrorB(null)

    if (!valid) return

    setLoading(true)
    setFetchError(null)
    setResultA(null)
    setResultB(null)

    try {
      const [a, b] = await Promise.all([runAudit(urlA.trim()), runAudit(urlB.trim())])
      setResultA(a)
      setResultB(b)
      if (!a || !b) setFetchError('One or both audits failed. Check the URLs and try again.')
    } catch {
      setFetchError('That URL didn\'t respond. Check the address and run the audit again.')
    } finally {
      setLoading(false)
    }
  }

  const hasResults = resultA && resultB

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-20 max-sm:py-12">
        <h1 className="font-serif text-4xl max-sm:text-3xl text-ink mb-2">Compare</h1>
        <p className="text-muted text-sm mb-8">Run two audits side by side.</p>

        {/* Two URL inputs */}
        <form onSubmit={handleSubmit} noValidate className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* URL A */}
            <div>
              <label htmlFor="compare-url-a" className="text-sm text-muted block mb-1">
                First URL
              </label>
              <input
                id="compare-url-a"
                type="url"
                value={urlA}
                onChange={(e) => { setUrlA(e.target.value); setErrorA(null) }}
                placeholder="https://example.com"
                className="w-full bg-card border border-line rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-sage"
                aria-describedby={errorA ? 'error-a' : undefined}
                aria-invalid={!!errorA}
              />
              {errorA && <p id="error-a" className="mt-1 text-xs text-bad">{errorA}</p>}
            </div>
            {/* URL B */}
            <div>
              <label htmlFor="compare-url-b" className="text-sm text-muted block mb-1">
                Second URL
              </label>
              <input
                id="compare-url-b"
                type="url"
                value={urlB}
                onChange={(e) => { setUrlB(e.target.value); setErrorB(null) }}
                placeholder="https://example.com"
                className="w-full bg-card border border-line rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-sage"
                aria-describedby={errorB ? 'error-b' : undefined}
                aria-invalid={!!errorB}
              />
              {errorB && <p id="error-b" className="mt-1 text-xs text-bad">{errorB}</p>}
            </div>
          </div>
          <PillButton type="submit" disabled={loading} id="compare-submit-btn">
            {loading ? 'Running…' : 'Compare'}
          </PillButton>
        </form>

        {/* Error */}
        {fetchError && (
          <div role="alert" className="mb-8 rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-ink">{fetchError}</p>
          </div>
        )}

        {/* Empty state */}
        {!hasResults && !loading && !fetchError && (
          <EmptyState
            illustration="empty"
            title="Nothing to compare yet"
            description="Enter two URLs above and run the audit to see them side by side."
          />
        )}

        {/* Side-by-side results */}
        {hasResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { label: getDomain(resultA.url), result: resultA },
              { label: getDomain(resultB.url), result: resultB },
            ].map(({ label, result }) => (
              <div key={label}>
                <h2 className="font-serif text-xl text-ink mb-4 truncate">
                  <em>{label}</em>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_META.map(({ id, key, label: catLabel }) => (
                    <ScoreCard
                      key={id}
                      categoryId={id}
                      label={catLabel}
                      score={result.scores[key]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
