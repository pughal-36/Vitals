import type { ReactNode } from 'react'
import { SketchFrame } from './SketchFrame'

interface FeatureItem {
  illustrationSlot: ReactNode  // spot illustration (96px square)
  title: string
  body: string
}

/**
 * FeatureRow — 4-column grid per DESIGN.md section 5.
 * Each cell: spot illustration 96px, h3, 2 lines of body.
 */
export function FeatureRow({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {items.map((item) => (
        <div key={item.title} className="flex flex-col items-start gap-3">
          {/* Spot illustration — 96×96 */}
          <div className="w-24 h-24 flex items-center justify-center">
            {item.illustrationSlot}
          </div>
          <h3 className="font-serif font-bold text-lg text-ink">{item.title}</h3>
          <p className="text-sm text-ink leading-relaxed max-w-[65ch]">{item.body}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * Band — full-width bg-band strip: h2 + body left, large framed illustration right.
 */
export function Band({
  heading,
  body,
  illustrationSlot,
}: {
  heading: ReactNode
  body: string
  illustrationSlot: ReactNode
}) {
  return (
    <section className="bg-band w-full">
      <div className="mx-auto max-w-6xl px-6 py-20 max-sm:py-12 flex flex-col sm:flex-row items-center gap-12">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-4xl max-sm:text-3xl text-ink leading-[1.1] mb-4">
            {heading}
          </h2>
          <p className="text-base text-ink leading-relaxed max-w-[65ch]">{body}</p>
        </div>
        {/* Right: framed illustration */}
        <SketchFrame className="shrink-0 w-64 h-64 flex items-center justify-center">
          {illustrationSlot}
        </SketchFrame>
      </div>
    </section>
  )
}
