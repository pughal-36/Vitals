'use client'

import { useState, useRef, type FormEvent } from 'react'
import type { AuditResult } from '@/app/api/audit/route'
import { PillButton } from '@/components/PillButton'

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function UrlAuditForm() {
  const [urlValue, setUrlValue] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<AuditResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleBlur = () => {
    if (urlValue && !isValidUrl(urlValue)) {
      setUrlError('Please enter a valid URL starting with https:// or http://')
    } else {
      setUrlError(null)
    }
  }

  const runAudit = async (url: string) => {
    setStatus('loading')
    setResult(null)
    setUrlError(null)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data: AuditResult = await res.json()
      setResult(data)
      setStatus(data.ok ? 'success' : 'error')
    } catch {
      setResult({
        ok: false,
        error: 'Network error — could not reach the audit service. Please try again.',
        fetchedAt: new Date().toISOString(),
      })
      setStatus('error')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = urlValue.trim()
    if (!trimmed) {
      setUrlError('Please enter a URL.')
      inputRef.current?.focus()
      return
    }
    if (!isValidUrl(trimmed)) {
      setUrlError('Please enter a valid URL starting with https:// or http://')
      inputRef.current?.focus()
      return
    }
    runAudit(trimmed)
  }

  const handleRetry = () => {
    const trimmed = urlValue.trim()
    if (trimmed && isValidUrl(trimmed)) runAudit(trimmed)
  }

  const isLoading = status === 'loading'

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* URL Input Form */}
      <form onSubmit={handleSubmit} noValidate className="mb-3">
        <div
          className={`flex items-center gap-2 p-1.5 rounded-full border border-line bg-card transition-all ${
            urlError ? 'ring-2 ring-bad' : ''
          }`}
        >
          <div className="flex-1 flex items-center gap-2 px-4 py-2 text-ink text-sm">
            <svg
              className="w-4 h-4 shrink-0 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref={inputRef}
              id="audit-url-input"
              type="url"
              value={urlValue}
              onChange={(e) => {
                setUrlValue(e.target.value)
                if (urlError) setUrlError(null)
              }}
              onBlur={handleBlur}
              placeholder="https://example.com"
              autoComplete="url"
              aria-label="Website URL to audit"
              aria-describedby={urlError ? 'url-error' : undefined}
              aria-invalid={!!urlError}
              disabled={isLoading}
              className="w-full bg-transparent outline-none placeholder:text-muted disabled:opacity-60 text-ink"
            />
          </div>
          <PillButton
            type="submit"
            id="audit-submit-btn"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Running…' : 'Run audit'}
          </PillButton>
        </div>

        {urlError && (
          <p id="url-error" role="alert" className="mt-2 text-sm text-bad">
            {urlError}
          </p>
        )}
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 text-center" aria-live="polite" aria-label="Audit in progress">
          <p className="text-muted text-sm">Running Lighthouse audit — this takes 10–20 seconds…</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && result && !result.ok && (
        <div role="alert" className="mt-8 rounded-2xl border border-line bg-card p-6">
          <p className="text-ink font-semibold text-sm mb-1">Audit failed</p>
          <p className="text-sm text-muted mb-3">{result.error}</p>
          <PillButton variant="outline" onClick={handleRetry} type="button">
            Try again
          </PillButton>
        </div>
      )}

      {/* Success — raw JSON for dev */}
      {status === 'success' && result && result.ok && (
        <div className="mt-8">
          <p className="text-muted text-sm mb-4">
            Scores loaded. The report display will be added in a later step.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary className="cursor-pointer text-sm text-muted hover:text-ink">View raw JSON</summary>
              <pre className="mt-3 p-4 rounded-2xl bg-card border border-line overflow-x-auto text-xs text-muted font-mono max-h-96">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
