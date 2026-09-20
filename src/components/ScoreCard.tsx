import { status, STATUS_LABEL, STATUS_COLOR, CATEGORY_DESCRIPTIONS } from '@/lib/scores'

interface ScoreCardProps {
  categoryId: string   // e.g. 'performance', 'best-practices'
  label: string        // Display label e.g. 'Best practices'
  score: number | null
}

/** Status dot — small coloured circle */
function StatusDot({ st }: { st: ReturnType<typeof status> }) {
  const color = STATUS_COLOR[st]
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color === 'text-good' ? 'bg-good' : color === 'text-warn' ? 'bg-warn' : color === 'text-bad' ? 'bg-bad' : 'bg-muted'}`}
      aria-hidden="true"
    />
  )
}

export function ScoreCard({ categoryId, label, score }: ScoreCardProps) {
  const st = status(score)
  const description = CATEGORY_DESCRIPTIONS[categoryId] ?? ''

  return (
    <div className="bg-card border border-line rounded-2xl p-5 flex flex-col gap-1">
      {/* Category name */}
      <p className="text-muted text-sm">{label}</p>

      {/* Score */}
      <p className="font-serif text-5xl text-ink leading-none mt-1">
        {score == null ? '—' : score}
      </p>

      {/* Status dot + word */}
      <div className="flex items-center gap-1.5 mt-2">
        <StatusDot st={st} />
        <span className="text-sm text-ink">{STATUS_LABEL[st]}</span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-muted text-sm mt-1">{description}</p>
      )}
    </div>
  )
}
