import type { ReactNode } from 'react'

/**
 * SketchFrame — wraps children in the wobbly hand-drawn border.
 * The wobble SVG filter (#wobble) is injected once in the root layout.
 * The CSS .sketch-frame class in globals.css applies the filter to ::before.
 */
export function SketchFrame({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`sketch-frame ${className}`}>
      {children}
    </div>
  )
}
