import { Libre_Baskerville, Inter, Caveat } from 'next/font/google'

export const serif = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif-var',
  display: 'swap',
})

export const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans-var',
  display: 'swap',
})

export const hand = Caveat({
  subsets: ['latin'],
  variable: '--font-hand-var',
  display: 'swap',
})
