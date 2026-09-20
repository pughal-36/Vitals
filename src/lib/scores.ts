// Shared score utilities used by ScoreCard, MetricRow, History, Compare

export const toScore = (s?: number | null): number | null =>
  s == null ? null : Math.round(s * 100)

export type ScoreStatus = 'good' | 'warn' | 'bad' | 'none'

export const status = (n: number | null): ScoreStatus =>
  n == null ? 'none' : n >= 90 ? 'good' : n >= 50 ? 'warn' : 'bad'

export const STATUS_LABEL: Record<ScoreStatus, string> = {
  good: 'Good',
  warn: 'Needs work',
  bad: 'Poor',
  none: 'Not measured',
}

export const STATUS_COLOR: Record<ScoreStatus, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  none: 'text-muted',
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  performance: 'How fast the page loads and responds',
  accessibility: 'How usable it is for everyone',
  'best-practices': 'Security and modern web standards',
  seo: 'How easily search engines can read it',
}
