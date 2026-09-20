import { Illustration } from '@/components/Illustration'
import { PillButton } from '@/components/PillButton'
import Link from 'next/link'

type IllustrationName = 'empty' | 'error'

interface EmptyStateProps {
  illustration?: IllustrationName
  title: string
  description: string
  /** Optional CTA — either a link href or a button onClick */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

/**
 * EmptyState — illustration + title + description + optional CTA.
 * Per DESIGN.md section 5.
 */
export function EmptyState({ illustration = 'empty', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-16 px-6">
      <div className="w-40 h-40">
        <Illustration name={illustration} width={160} height={160} />
      </div>
      <h2 className="font-serif font-bold text-lg text-ink">{title}</h2>
      <p className="text-sm text-muted max-w-xs">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href}>
            <PillButton variant="solid">{action.label}</PillButton>
          </Link>
        ) : (
          <PillButton variant="solid" onClick={action.onClick}>{action.label}</PillButton>
        )
      )}
    </div>
  )
}
