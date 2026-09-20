# Vitals — Design Spec

Read this fully before writing any UI code. Follow it exactly. If something is not covered here, ask instead of inventing. Do not add libraries, fonts, images or icons that are not listed here.

Stack: Next.js (App Router) + Tailwind. Free tools only.

## 1. Look in one paragraph

Hand-drawn black ink line art on a soft off-white page (light) or a deep charcoal page (dark). One muted sage-green accent. Lots of whitespace. Serif headings, clean sans body. Pill-shaped buttons. No shadows, no gradients. Illustrations appear on the landing page, loading, empty and error states. The report screens stay calm and data-first.

## 2. Tokens

Every colour comes from a CSS variable. Never hard-code a hex in a component. Never sprinkle `dark:` variants for colours; the tokens flip by themselves.

```css
:root {
  --paper:  #FBFAF7;  /* page background */
  --card:   #F1EFEA;  /* cards, alternate sections */
  --band:   #E0EAE1;  /* highlight band (mint) */
  --ink:    #1A1A1A;  /* text + illustration strokes */
  --muted:  #5F5F5A;  /* secondary text */
  --sage:   #8FB996;  /* accent fills and frames. NOT for text */
  --line:   color-mix(in srgb, var(--ink) 14%, transparent);
  --good:   #3F7F5A;  /* status dots, icons, thin bars ONLY */
  --warn:   #B57A1E;  /* status dots, icons, thin bars ONLY */
  --bad:    #B93F35;  /* status dots, icons, thin bars ONLY */
}
.dark {
  --paper:  #121412;
  --card:   #1B1D1B;
  --band:   #1C2620;
  --ink:    #EDEBE6;
  --muted:  #A5A39C;
  --sage:   #8FB996;
  --line:   color-mix(in srgb, var(--ink) 16%, transparent);
  --good:   #8FB996;
  --warn:   #E0B25A;
  --bad:    #E47B6E;
}
```

Tailwind wiring. Check the installed version first.

- Tailwind v4: in `globals.css` add
  `@custom-variant dark (&:where(.dark, .dark *));`
  and
  `@theme inline { --color-paper: var(--paper); --color-card: var(--card); --color-band: var(--band); --color-ink: var(--ink); --color-muted: var(--muted); --color-sage: var(--sage); --color-line: var(--line); --color-good: var(--good); --color-warn: var(--warn); --color-bad: var(--bad); }`
- Tailwind v3: set `darkMode: 'class'` and map the same names in `theme.extend.colors` as `'var(--paper)'` etc.

Usage: `bg-paper text-ink`, `bg-card`, `border-line`, `text-muted`.

Status colours (`good`/`warn`/`bad`) are for the dot, icon or thin bar only. The words next to them ("Good", "Needs work", "Poor") are always `text-ink`. Never colour alone: always pair with a word.

Status thresholds. Category scores are 0–100: 90–100 good, 50–89 warn, 0–49 bad. Audit scores from Lighthouse are 0–1: 0.9+ good, 0.5–0.89 warn, below 0.5 bad.

## 3. Typography

All three are Google Fonts under the SIL Open Font License (free for commercial use). Load with `next/font/google` only. No `<link>` tags, no downloaded font files.

```ts
import { Libre_Baskerville, Inter, Caveat } from 'next/font/google'
export const serif = Libre_Baskerville({ subsets:['latin'], weight:['400','700'], style:['normal','italic'], variable:'--font-serif', display:'swap' })
export const sans  = Inter({ subsets:['latin'], variable:'--font-sans', display:'swap' })
export const hand  = Caveat({ subsets:['latin'], variable:'--font-hand', display:'swap' })
```

| Role | Font | Size (desktop / mobile) | Notes |
|---|---|---|---|
| h1 | serif 400 | 56 / 36 px, line-height 1.1 | one italic word or short phrase allowed, in `<em>` |
| h2 | serif 400 | 36 / 28 px | same italic rule |
| h3 | serif 700 | 18 px | feature titles, card titles |
| body | sans 400 | 16 px, line-height 1.6 | max 65 characters wide |
| small | sans 400 | 14 px, `text-muted` | |
| annotation | hand | 20 px | max 1 per screen, e.g. a caption under an illustration |

Sentence case everywhere. No all-caps labels. No tracked-out eyebrows. No gradient text.

## 4. Layout and shape

- Content width: `max-w-6xl`, centred, `px-6`. Section spacing: `py-20` desktop, `py-12` mobile.
- Landing sections alternate `bg-paper` and one `bg-band` highlight band.
- Buttons and inputs: fully rounded (pill). Cards: `rounded-2xl`, `bg-card`, `border border-line`. Illustration frames: slightly wobbly, see section 6.
- No box-shadows. No gradients. Depth comes from `bg-card` and `border-line` only.
- Nav: logo left; links Home, History, Compare (text only, no emoji); theme toggle on the right. Active link has a thin underline. 1px `border-line` bottom border. Logo is the word "Vitals" in serif with the existing bolt icon drawn in `currentColor`.

## 5. Components

| Component | Spec |
|---|---|
| `PillButton` | `variant="solid"`: `bg-ink text-paper`. `variant="outline"`: transparent, 1.5px `border-ink`. Height 44px, `px-6`, 14px medium text. Visible focus ring (2px `ring-sage` with offset). |
| `UrlForm` | one pill-shaped input + solid `PillButton` labelled "Run audit" inside the same rounded container. Search icon on the left. Validates the URL before submit. |
| `Nav` | as section 4. Collapses to a menu button under 768px. |
| `ThemeToggle` | icon button, cycles light / dark. Uses `next-themes`. Renders only after mount to avoid hydration mismatch. `aria-label="Switch theme"`. |
| `Hero` | left: h1, one line of body, `UrlForm`. Right: hero illustration. Stacks on mobile with the illustration below. |
| `FeatureRow` | 4 columns (2 on tablet, 1 on mobile). Each: spot illustration 96px, h3, 2 lines of body. |
| `Band` | full-width `bg-band` strip: h2 + short body on the left, large framed illustration on the right. |
| `SketchFrame` | wraps children in the wobbly border. |
| `Illustration` | inline-SVG wrapper, see section 7. |
| `ScoreCard` | see section 11. |
| `MetricRow` | see section 11. |
| `EmptyState` | illustration + one-line title + one line of direction + one `PillButton`. |
| `ChatPanel` | the streaming AI chat, styled as a plain `bg-card` card. No illustration. Built later (FE-06). |

## 6. The hand-drawn look (SketchFrame)

Pure SVG/CSS, no library. Add the filter once in the root layout:

```html
<svg width="0" height="0" aria-hidden="true" focusable="false">
  <filter id="wobble">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>
  </filter>
</svg>
```

```css
.sketch-frame { position: relative; }
.sketch-frame::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  border: 2px solid var(--ink); border-radius: 4px;
  filter: url(#wobble);
}
```

Apply the filter to the border pseudo-element only, never to text or the illustration itself.

## 7. Illustrations

Files are supplied by the developer (hand-drawn black-line SVGs). Never draw, generate or download illustrations yourself. If a file is missing, render a plain `bg-card` placeholder box with the intended filename inside it and continue.

Expected files in `src/assets/illustrations/`:

| File | Used in | Notes |
|---|---|---|
| `hero.svg` | Hero | large, about 600x600 |
| `feature-performance.svg` | FeatureRow | square |
| `feature-seo.svg` | FeatureRow | square |
| `feature-accessibility.svg` | FeatureRow | square |
| `feature-ai.svg` | FeatureRow | square |
| `loading.svg` | `/audit` loading state | animate lightly, see section 9 |
| `empty.svg` | empty states (History with no audits, Compare with nothing selected) | |
| `error.svg` | error / 404 (may be the same file as `empty.svg`) | |

Rules so they work in both themes:

1. Illustrations must be inlined as React components, never `<img src>`, because an `<img>` cannot inherit theme colours. Convert with SVGR: `npx @svgr/cli --typescript --out-dir src/components/illustrations src/assets/illustrations`.
2. In each SVG: strokes `currentColor`; fills either `none` or `currentColor`; white or paper-coloured fills become `var(--paper)`. Remove any hard-coded colours except an optional single `var(--sage)` accent. Remove fixed `width`/`height` and keep `viewBox`.
3. The `Illustration` wrapper sets `className="text-ink"` and `aria-hidden="true"` (they are decorative). Use `role="img"` and a `title` only if the image carries meaning.
4. After converting, check every illustration in both themes by eye. Large solid-black areas turn into large light areas in dark mode; if one looks wrong, change that fill to `none` or `var(--paper)` and keep the outline.

## 8. Dark mode

- Use `next-themes`: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` in the root layout, and `<html lang="en" suppressHydrationWarning>`.
- The `.dark` class on `<html>` swaps the tokens. Components never check the theme themselves.
- Theme choice persists (next-themes handles it). The nav toggle is the only control.
- Both themes must pass WCAG AA for body text. Do not use `--sage` for text in either theme.

## 9. Motion

- Default: no motion. No scroll-triggered fade-ins. No hover lift on cards.
- Allowed: button hover colour change; the `FeatureRow` spot illustration fills with `--sage` on hover; one loading animation on `/audit` (for example a stopwatch hand or dots cycling), CSS keyframes only.
- Everything animated must respect `@media (prefers-reduced-motion: reduce)` by turning the animation off.

## 10. Copy

- Plain verbs, sentence case, no filler. Buttons say what happens: "Run audit", "Copy report link".
- Errors do not apologise. Say what happened and what to do next: "That URL didn't respond. Check the address and run the audit again."
- Empty states invite an action: "No audits yet. Paste a URL to run your first one."
- Never use fake statistics or testimonials.
- Do not promise unbuilt features. The AI summary is mentioned in copy only once it exists.

## 11. Screens

### 11.1 Landing `/`

Nav, Hero, FeatureRow (Performance, SEO, Accessibility, AI explanations), Band CTA, footer.

Restyle the existing scaffold:
- h1 becomes "Audit your site's <em>Web Vitals</em>" in serif. Remove the blue-to-green gradient text.
- Replace the subtitle with: "Paste a URL to get performance, accessibility, best-practices and SEO scores." Remove "Coming soon."
- Remove the "Week 3 Capstone — Scaffold Ready" badge.
- The Scan button becomes a solid `PillButton` labelled "Run audit".
- Remove the emoji-style icons from the nav links.
- The PSI health-check block that currently sits under the form moves to the report screen (11.3). The landing page does not show scores.

### 11.2 Loading `/audit`

`loading.svg`, rotating one-line status text (for example "Fetching PageSpeed data…"), cancel link.

### 11.3 Report (the current results block, and `/report/[id]` when it gets its own route)

Data first. No big illustrations. Order top to bottom:

1. **Header.** `h2` in serif: `Report for <em>{domain}</em>`. Under it one `text-muted` line: `Mobile · Fetched 18 Sep 2026, 7:09 pm`. Format with `new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fetchedAt))`. No raw ISO string, no green monospace URL, no "PSI Health Check" title.
2. **Four `ScoreCard`s** (2 columns on mobile, 4 on desktop).
3. **Core Web Vitals** (`MetricRow` list).
4. **Opportunities** list.
5. **`ChatPanel`** (later).
6. **Raw JSON** in a `<details>` at the very bottom, inside a `bg-card` block. Render it only when `process.env.NODE_ENV === 'development'`.

**Fetching the data.** The PageSpeed Insights request must ask for all four categories. The `category` param is repeated, not comma-separated:

```ts
const params = new URLSearchParams({ url, key, strategy: 'mobile' })
;['performance', 'accessibility', 'best-practices', 'seo']
  .forEach(c => params.append('category', c))
```

Read scores from `lighthouseResult.categories[id].score` (0–1). A missing category must never display as 0:

```ts
const toScore = (s?: number | null) => (s == null ? null : Math.round(s * 100))
const status = (n: number | null) =>
  n == null ? 'none' : n >= 90 ? 'good' : n >= 50 ? 'warn' : 'bad'
const STATUS_LABEL = { good: 'Good', warn: 'Needs work', bad: 'Poor', none: 'Not measured' }
```

If scores are still missing, log `Object.keys(lighthouseResult.categories)` and check what came back.

**`ScoreCard`.** `bg-card border border-line rounded-2xl p-5`. No tinted backgrounds, no coloured borders.
- Top: category name in `text-muted text-sm`.
- Middle: the score in serif, `text-5xl text-ink`. If `null`, show "—".
- Bottom: a status dot or icon in the status colour, then the status word in `text-ink`.
- One description line under it, `text-muted text-sm`:
  - Performance: "How fast the page loads and responds"
  - Accessibility: "How usable it is for everyone"
  - Best practices: "Security and modern web standards"
  - SEO: "How easily search engines can read it"

**Core Web Vitals (`MetricRow`).** Read from `lighthouseResult.audits`. Audit ids: `first-contentful-paint`, `largest-contentful-paint`, `total-blocking-time`, `cumulative-layout-shift`, `speed-index`. Each row: metric name, `displayValue`, status dot + word derived from `audit.score` (0–1 thresholds in section 2). Use plain names: "First contentful paint", "Largest contentful paint", "Total blocking time", "Cumulative layout shift", "Speed index".

**Opportunities.** List audits where `details?.overallSavingsMs > 0`, sorted by savings, highest first. Each row: audit `title` and "Could save about X s" (convert ms to seconds, one decimal). Lighthouse versions differ slightly, so check the audit objects in the response and adjust the field if needed. If the list is empty, show "No speed opportunities found."

**Errors.**
- Fetch failed: `EmptyState` with `error.svg`. "That URL didn't respond. Check the address and run the audit again."
- Rate limited or missing API key: say so directly ("The PageSpeed API rejected the request. Check the API key and quota."). Never show 0s in place of an error.

### 11.4 History and Compare

Both are in the nav already. Structure only, reusing existing components:
- **History:** list of past audits as `bg-card` rows: domain, date, four small scores with status dots. Empty: `EmptyState` with `empty.svg` and "No audits yet. Paste a URL to run your first one."
- **Compare:** two URL inputs, then two columns of `ScoreCard`s side by side. Empty: `EmptyState` with `empty.svg`.

## 12. Quality floor

- Responsive down to 360px wide. No horizontal scroll.
- Visible keyboard focus on every interactive element.
- Semantic HTML: one `h1` per page, landmarks (`header`, `main`, `footer`), labelled form controls.
- Decorative illustrations use `aria-hidden`.

## 13. Build order

Build one step at a time and stop after each so the developer can review.

1. Tokens, fonts, theme provider, `ThemeToggle`, `PillButton`.
2. Fix the PSI request (all four categories) and the null-score handling. Check the numbers are correct before restyling.
3. `ScoreCard` and the report header.
4. Core Web Vitals and Opportunities.
5. `Nav` + `Hero` restyle (illustration placeholders are fine).
6. `FeatureRow` + `Band` + `SketchFrame`.
7. Convert and wire real illustrations (section 7).
8. `/audit` loading state.
9. Empty and error states, History and Compare.

## 14. Don't

- Don't add shadows, gradients, gradient text, glassmorphism or emoji.
- Don't add icon or animation libraries. Use `lucide-react` only if it is already installed, and only for small UI icons (menu, sun/moon, search, status).
- Don't copy artwork from other websites or screenshots.
- Don't change the palette, fonts or radii without asking.
- Don't put the PageSpeed API key in client code. Call the API from a server route or server action only, and never prefix the key with `NEXT_PUBLIC_`.
