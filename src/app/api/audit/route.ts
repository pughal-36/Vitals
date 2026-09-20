import { NextResponse } from 'next/server'
import { saveScan } from '@/lib/supabase/scans'

export interface AuditSuccess {
  ok: true
  url: string
  fetchedAt: string
  scores: {
    performance: number | null
    accessibility: number | null
    bestPractices: number | null
    seo: number | null
  }
  audits: Record<string, { score: number | null; displayValue?: string; title?: string; details?: Record<string, unknown> }> | undefined
  raw: Record<string, { score: number | null; title?: string }> | undefined
}

export interface AuditFailure {
  ok: false
  error: string
  fetchedAt: string
}

export type AuditResult = AuditSuccess | AuditFailure

const toScore = (s?: number | null): number | null =>
  s == null ? null : Math.round(s * 100)

export async function POST(req: Request) {
  const { url, strategy = 'mobile' }: { url: string; strategy?: string } =
    await req.json()

  // Server-side URL validation
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid URL.', fetchedAt: new Date().toISOString() },
      { status: 400 }
    )
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'URL must start with http:// or https://.',
        fetchedAt: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  const resolvedStrategy: 'mobile' | 'desktop' =
    strategy === 'desktop' ? 'desktop' : 'mobile'

  try {
    // VITALS_PAGESPEED_API_KEY is server-only — never exposed to the browser.
    const key = process.env.VITALS_PAGESPEED_API_KEY ?? ''
    const params = new URLSearchParams({ url, strategy: resolvedStrategy })
    if (key) params.set('key', key)
    // Repeat category param — not comma-separated
    ;['performance', 'accessibility', 'best-practices', 'seo'].forEach((c) =>
      params.append('category', c)
    )

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`
    const resp = await fetch(apiUrl)

    if (!resp.ok) {
      const body = await resp.text()
      return NextResponse.json(
        {
          ok: false,
          error:
            resp.status === 429
              ? 'The PageSpeed API rejected the request. Check the API key and quota.'
              : `PageSpeed API error ${resp.status}: ${body.slice(0, 200)}`,
          fetchedAt: new Date().toISOString(),
        },
        { status: 502 }
      )
    }

    const data = await resp.json()
    const lighthouseResult = data.lighthouseResult
    const categories = lighthouseResult?.categories ?? {}

    // Step 2 diagnostic log — keep in commit
    console.log('[psi] Object.keys(lighthouseResult.categories):', Object.keys(categories))

    const scores = {
      performance: toScore(categories['performance']?.score),
      accessibility: toScore(categories['accessibility']?.score),
      bestPractices: toScore(categories['best-practices']?.score),
      seo: toScore(categories['seo']?.score),
    }

    const result: AuditSuccess = {
      ok: true,
      url: data.id ?? url,
      fetchedAt: new Date().toISOString(),
      scores,
      audits: lighthouseResult?.audits,
      raw: categories,
    }

    // Persist to Supabase — fire-and-forget
    saveScan({
      url: data.id ?? url,
      strategy: resolvedStrategy,
      score_performance: scores.performance,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_seo: scores.seo,
      raw_categories: categories as Record<string, unknown>,
    }).catch((err) => console.error('[supabase] saveScan failed:', err))

    return NextResponse.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error from PageSpeed API.'
    const result: AuditFailure = {
      ok: false,
      error: message,
      fetchedAt: new Date().toISOString(),
    }
    return NextResponse.json(result, { status: 502 })
  }
}
