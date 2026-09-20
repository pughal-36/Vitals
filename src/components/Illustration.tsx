import type { SVGProps } from 'react'
import type { ComponentType } from 'react'
import dynamic from 'next/dynamic'

type SvgComp = ComponentType<SVGProps<SVGSVGElement>>

type IllustrationName =
  | 'hero'
  | 'feature-performance'
  | 'feature-seo'
  | 'feature-accessibility'
  | 'feature-ai'
  | 'loading'
  | 'empty'
  | 'error'

interface IllustrationProps {
  name: IllustrationName
  width?: string | number
  height?: string | number
  className?: string
}

// Dynamic imports — split huge SVG bundles per page
const map: Record<Exclude<IllustrationName, 'error'>, SvgComp> = {
  'hero':                   dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/Hero')),
  'feature-performance':    dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/FeaturePerformance')),
  'feature-seo':            dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/FeatureSeo')),
  'feature-accessibility':  dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/FeatureAccessibility')),
  'feature-ai':             dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/FeatureAi')),
  'loading':                dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/Loading')),
  'empty':                  dynamic<SVGProps<SVGSVGElement>>(() => import('./illustrations/Empty')),
}

/**
 * Illustration — inline-SVG wrapper per DESIGN.md section 7.
 * Sets text-ink (currentColor) and aria-hidden (decorative).
 */
export function Illustration({ name, width = '100%', height = '100%', className = '' }: IllustrationProps) {
  const resolvedName: Exclude<IllustrationName, 'error'> = name === 'error' ? 'empty' : name
  const Comp = map[resolvedName]

  if (!Comp) {
    return (
      <div
        className={`bg-card border border-line rounded-xl flex items-center justify-center text-muted text-xs p-2 ${className}`}
        aria-hidden="true"
        style={{ width, height }}
      >
        {name}.svg
      </div>
    )
  }

  return (
    <span className={`text-ink block ${className}`} aria-hidden="true">
      <Comp width={width} height={height} />
    </span>
  )
}
