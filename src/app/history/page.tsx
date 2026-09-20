import { listScans } from '@/lib/supabase/scans'
import { EmptyState } from '@/components/EmptyState'
import { status, STATUS_LABEL, STATUS_COLOR } from '@/lib/scores'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History',
  description: 'Past PageSpeed audits, newest first.',
}

function StatusDot({ st }: { st: ReturnType<typeof status> }) {
  const bg =
    st === 'good' ? 'bg-good'
    : st === 'warn' ? 'bg-warn'
    : st === 'bad'  ? 'bg-bad'
    : 'bg-muted'
  return <span className={`inline-block w-2 h-2 rounded-full ${bg}`} aria-hidden="true" />
}

function ScorePill({ label, score }: { label: string; score: number | null }) {
  const st = status(score)
  return (
    <div className="flex flex-col items-center gap-1 min-w-[48px]">
      <div className="flex items-center gap-1">
        <StatusDot st={st} />
        <span className="text-sm text-ink tabular-nums font-serif">{score ?? '—'}</span>
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}

export default async function HistoryPage() {
  let scans: Awaited<ReturnType<typeof listScans>> = []
  try {
    scans = await listScans(50)
  } catch {
    // Supabase not configured — show empty state
    scans = []
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-6 py-20 max-sm:py-12">
        <h1 className="font-serif text-4xl max-sm:text-3xl text-ink mb-2">History</h1>
        <p className="text-muted text-sm mb-8">All past audits, newest first.</p>

        {scans.length === 0 ? (
          <EmptyState
            illustration="empty"
            title="No audits yet"
            description="Paste a URL to run your first one."
            action={{ label: 'Run audit', href: '/' }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-card border border-line rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* URL + timestamp */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{scan.url}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(scan.created_at)
                    )}{' '}
                    · {scan.strategy}
                  </p>
                </div>

                {/* Score pills */}
                <div className="flex gap-4 shrink-0">
                  <ScorePill label="Perf"  score={scan.score_performance}  />
                  <ScorePill label="A11y"  score={scan.score_accessibility} />
                  <ScorePill label="BP"    score={scan.score_best_practices} />
                  <ScorePill label="SEO"   score={scan.score_seo}           />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
