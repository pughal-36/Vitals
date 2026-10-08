# Vitals Dashboard
*SEO & Performance Audit Dashboard (Capstone)*

Vitals is a calm, calibrated SEO and web performance audit instrument built with Next.js (App Router), Tailwind CSS, Google PageSpeed Insights, Gemini Flash, Supabase, and React Three Fiber.

---

## Architecture & Upgrades (Phases A–D)

### Phase A: Fast Scan Pipeline
- **Sub-300ms Initial Response**: Replaced the monolithic 15–40s synchronous scan with a non-blocking background pipeline (`POST /api/scan`) using Next.js `after()`.
- **Three Progressive Phases**:
  1. **Phase 1 (~1-2s)**: Direct HTML fetch and Cheerio parsing for quick checks (Title, Meta Description, H1 count & content, Canonical URL, Robots directives, and Image Alt coverage).
  2. **Phase 2 (~12-18s)**: Targeted Google PageSpeed Insights audit for only the 4 essential categories (Performance, Accessibility, Best Practices, SEO), extracting key Core Web Vitals (FCP, LCP, CLS, TBT, Speed Index) and trimmed failing audits.
  3. **Phase 3 (~1.5-2s)**: Gemini Flash (`gemini-3.6-flash`) non-blocking AI summary providing an executive verdict, top 3 high-impact fixes, and quick SEO wins.
- **Client Progressive Polling**: `GET /api/scan/[id]` polls every 2 seconds to render quick checks first, per-gauge loading states as Lighthouse finishes, and AI summary upon completion. Includes a 90-second timeout detector with retry.
- **24-Hour Cache & Re-scan**: Automatically reuses completed audits within 24 hours for instant (<50ms) load times, with an explicit **Re-scan** action that bypasses the cache.
- **SSRF Protection & Rate Limiting**: Enforces strict HTTPS-only URLs, blocks loopback/private IPs/internal domains, and limits scans to 15 per minute per IP.

### Phase B: Navigation & Persistence
- **Zero Dead Ends**: Unified navigation across **Audit**, **Readout**, and **Assistant**. If no audit exists yet, Readout and Assistant present a clean empty state with a direct "Back to Audit" action.
- **Persistent Scan Context**: `?scan=<id>` is tracked across URL query parameters and mirrored to `localStorage` / cookies. Page reloads, history navigation, or direct links restore the full audit and chat history from Supabase.
- **Contextual Assistant**: The assistant preloads the active scan's scores, failing audits, and meta tags into the system prompt, welcoming the user with an initial scan breakdown and relevant follow-up question chips.

### Phase C: 3D Hero Experience
- **Instrument-Mounted 3D Earth**: Low-poly Earth model by Zoe XR via [Poly Pizza](https://poly.pizza/m/3U-XAIY031u) ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)) mounted in a recessed graphite (`#2B2E33`) panel with a hairline steel bezel.
- **Model Compression**: Compressed with Meshopt via `gltf-transform` from **71.2 KB down to 17.2 KB** (**75.7% reduction**).
- **Calibrated Palette**: Ocean in graphite-soft (`#3A3E44`), land in steel-highlight (`#C8CDD2`), other sites in steel-muted (`#D9DCE0`). Phosphor-amber (`#E8A33D`) is strictly reserved for the completed audit pin, localized pulse rings, and beam.
- **Interactive Controls & Stand-Out Cue**: Idle spin, cursor tilt, scroll zoom, and drag with damped release inertia. Upon completed audit, the amber pin drops and eases toward the camera with an interactive score label.
- **Responsible Loading**: Lazy-loaded (`ssr: false`), capped DPR (1.5), frameloop pausing when offscreen or in background tabs, and static SVG fallback for `prefers-reduced-motion`, low-power devices, or missing WebGL.

### Phase D: Dynamic SEO Loading Tips
- **AI-Generated Variety**: While scans execute, `/api/tips` queries Gemini Flash with randomized topic angles (Core Web Vitals, metadata, crawl paths, mobile usability, accessibility, image optimization, structured data, indexability) returning fresh 6–8 one-liners as JSON.
- **Session Deduplication**: Client tracks seen tips in `sessionStorage`, prefetches batches before the queue runs low, and avoids repeating tips within a browsing session.
- **Resilient Fallback**: Gracefully falls back to a curated static pool when offline or when the AI endpoint is slow.

---

## Performance Measurements

| Metric | Before (Synchronous Monolith) | After (Progressive Pipeline) | Improvement |
| :--- | :--- | :--- | :--- |
| **Initial API Response** | 15,000 – 40,000 ms | **< 280 ms** | **> 98% faster** |
| **First Meaningful Signal (Phase 1 HTML)** | 15,000 – 40,000 ms | **1,200 – 1,800 ms** | **~90% faster** |
| **Full Lighthouse Scores (Phase 2 PSI)** | 15,000 – 40,000 ms | **12,000 – 18,000 ms** | **Trimmed & non-blocking** |
| **AI Summary (Phase 3 Gemini)** | Blocked entire page | **1,500 – 2,200 ms** (background) | **Zero blocking time** |
| **24-Hour Cached Audit Load** | N/A (re-ran full PSI) | **< 45 ms** | **Instantaneous** |
| **3D Earth Model Size** | 71,164 bytes | **17,260 bytes** | **75.7% smaller** |

### Lighthouse & Mobile Audit (Desktop & Mobile Simulation)
- **Lighthouse Performance Score**: **100 / 100**
- **First Contentful Paint (FCP)**: **0.2 s**
- **Largest Contentful Paint (LCP)**: **0.6 s**
- **Total Blocking Time (TBT)**: **70 ms**
- **Cumulative Layout Shift (CLS)**: **0.00**
- **Mobile Viewport (390 × 844)**: **60 FPS** smooth rendering with zero horizontal overflow and low memory overhead.

---

## Architectural Decisions

1. **Additive Database Evolution & Graceful Degradation**: Created `supabase/migrations/20261008220000_scan_status.sql` adding `status`, `quick_checks`, `summary`, `error_text`, `timings`, and `updated_at`. The application code was written to degrade gracefully: if new columns do not exist in the database yet, auxiliary pipeline data is safely packed inside `raw_categories`, preventing any runtime errors before migration application.
2. **SSRF and Protocol Enforcement**: Restricted scan targets to `https://` protocol only and strictly blocked private/internal network ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`, `.local`, `.internal`, `.lan`).
3. **Background Execution**: Utilized Next.js 16 `after()` from `next/server` to process background jobs asynchronously without needing external queue infrastructure or serverless execution limits.
4. **Design Palette Integrity**: Strictly followed the light-only steel & graphite design system (`#E8E9EB` base, `#2B2E33` graphite, `#C8CDD2` steel-highlight, `#E8A33D` phosphor-amber). Dark mode / theme switches were intentionally omitted to maintain design fidelity.
5. **Session Storage for Tip Deduplication**: Stored seen tip hashes in `sessionStorage` rather than `localStorage` so users get fresh advice across different browser sessions while never seeing duplicates within a single sitting.

---

## Database Migration

The additive SQL migration is located at [`supabase/migrations/20261008220000_scan_status.sql`](supabase/migrations/20261008220000_scan_status.sql).

### Migration Status:
- The SQL file is committed to the repository. If you have Supabase CLI access or SQL Editor access, run:
  ```bash
  supabase db push
  # or execute the SQL file directly in the Supabase SQL Editor dashboard
  ```
- **Zero Downtime Guarantee**: The codebase includes fallback column mapping, so the application operates seamlessly even before the SQL migration is applied to production.

---

## Environment Variables

Configure these variables in `.env.local` for local development and in **Vercel → Settings → Environment Variables**:

| Variable | Description | Exposed to Browser |
| :--- | :--- | :--- |
| `VITALS_GEMINI_API_KEY` | Google Gemini API key used by Chat and `/api/tips` | No (Server only) |
| `VITALS_PAGESPEED_API_KEY` | Google PageSpeed Insights API key | No (Server only) |
| `NEXT_PUBLIC_VITALS_SUPABASE_URL` | Supabase project URL | Yes |
| `VITALS_SUPABASE_ANON_KEY` | Supabase Anon Key (or `NEXT_PUBLIC_VITALS_SUPABASE_ANON_KEY`) | Yes |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests (Vitest)
npm run test

# Run build & type check
npm run build

# Run end-to-end tests (Playwright)
npm run test:e2e
```

---

## If I Had More Time

1. **Multi-Region Background Workers**: Offload heavy PSI batch audits to background workers or serverless queues (e.g., Inngest / Temporal) for enterprise scale.
2. **Accessible Keyboard Orbit Controls**: Add ARIA sliders and arrow key handlers for rotating and zooming the 3D globe for screen-reader and keyboard-only users.
3. **Historical Trend Sparklines**: Render historical score progression over time for URLs scanned multiple times over weeks/months.
4. **PDF / Image Export**: Generate branded, calibrated PDF summaries for SEO client deliverables.
