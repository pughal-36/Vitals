import { status, STATUS_LABEL, STATUS_COLOR } from '@/lib/scores'

interface MetricRowProps {
  name: string
  displayValue: string | undefined
  score: number | null  // 0–1 from Lighthouse
}

function StatusDot({ st }: { st: ReturnType<typeof status> }) {
  const bg =
    st === 'good' ? 'bg-good'
    : st === 'warn' ? 'bg-warn'
    : st === 'bad'  ? 'bg-bad'
    : 'bg-muted'
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${bg}`} aria-hidden="true" />
}

export function MetricRow({ name, displayValue, score }: MetricRowProps) {
  // Audit scores are 0–1; convert to 0–100 for status thresholds
  const pct = score == null ? null : Math.round(score * 100)
  const st = status(pct)

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-line last:border-0">
      <span className="text-sm text-ink">{name}</span>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm text-muted tabular-nums">{displayValue ?? '—'}</span>
        <div className="flex items-center gap-1.5">
          <StatusDot st={st} />
          <span className="text-sm text-ink">{STATUS_LABEL[st]}</span>
        </div>
      </div>
    </div>
  )
}
