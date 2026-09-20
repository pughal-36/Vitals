'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Illustration } from '@/components/Illustration'

const MESSAGES = [
  'Fetching PageSpeed data…',
  'Running Lighthouse audit…',
  'Analysing performance…',
  'Checking accessibility…',
  'Reviewing SEO signals…',
  'Almost done…',
]

export default function AuditLoading() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-8"
      aria-live="polite"
      aria-label="Audit in progress"
    >
      {/* Loading illustration */}
      <div className="w-48 h-48">
        <Illustration name="loading" width={192} height={192} />
      </div>

      {/* Cycling status text */}
      <p className="text-base text-ink text-center" aria-atomic="true">
        {MESSAGES[idx]}
      </p>

      {/* Cancel link */}
      <Link
        href="/"
        className="text-sm text-muted underline underline-offset-4 hover:text-ink transition-colors"
      >
        Cancel
      </Link>
    </div>
  )
}
