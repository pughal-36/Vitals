# Vitals Dashboard
*SEO & Performance Audit Dashboard (Week 3 Capstone)*

## FE Track assignment log

- **FE-06: Streaming AI Chat Interface** - Built a Gemini-backed streaming audit chat with `useChat`, thinking and streaming states, markdown rendering, stop and auto-scroll controls, and a server-side route handler. [Evidence: commit `4169e32`](https://github.com/pughal-36/Vitals/commit/4169e3207786cf4071e00c1695555ec01dcd039f)
- **FE-07 — Tool calling & generative UI** - Added the server-side `fetchMetaTags` tool and typed tool-part lifecycle states for streaming, results, and errors in the chat UI; the confirmation-tool requirement was skipped because this capstone does not currently mutate data from chat. [Evidence: commit `8c283a7`](https://github.com/pughal-36/Vitals/commit/8c283a79e1aa33bc4534b3bc01f115e02dede614)

## FE-06: Streaming AI Chat Interface
This feature converts the audit-summary AI into a real-time streaming interface using the Vercel AI SDK and Gemini Flash.

**Key components:**
- **Route Handler**: [`src/app/api/chat/route.ts`](file:///c:/Users/HP/Desktop/Vitals/src/app/api/chat/route.ts) — handles API requests, converts UI messages to model format, and returns a `toUIMessageStreamResponse`.
- **Client Component**: [`src/app/chat/AuditChat.tsx`](file:///c:/Users/HP/Desktop/Vitals/src/app/chat/AuditChat.tsx) — a fully featured `useChat` implementation with a thinking indicator, markdown support, stop functionality, and auto-scroll logic.
- **Model Config**: [`src/lib/gemini/model.ts`](file:///c:/Users/HP/Desktop/Vitals/src/lib/gemini/model.ts) — single provider factory that safely bridges the `GEMINI_API_KEY`.
- **System Prompt**: [`src/lib/gemini/prompts.ts`](file:///c:/Users/HP/Desktop/Vitals/src/lib/gemini/prompts.ts) — extracted prompt module to keep config decoupled for FE-07.

### Tool Contract: `fetchMetaTags`
This project includes a server-side AI tool called `fetchMetaTags` that allows the assistant to retrieve OpenGraph and meta tag data from any valid URL.

**Zod Schema:**
```typescript
{
  url: z.string().url("Must be a valid URL")
}
```

**Return Object Shape:**
The tool fetches the HTML content server-side, parses it using `cheerio`, and returns the following structure. Fields are `null` if the corresponding tag is not found in the HTML.
```typescript
{
  title: string | null,
  description: string | null,
  ogTitle: string | null,
  ogDescription: string | null,
  ogImage: string | null,
  canonicalUrl: string | null,
}
```

**Error Handling:**
If the URL fetch fails, times out, or returns a non-OK status, the `execute` function will **throw an Error**. The AI SDK will catch this and emit an `output-error` UI message part to the client.

**Preview URL**: Visit `/chat` locally to test.

---
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## FE-09 — Interactive Earth, saved readouts, and audit tips

- Replaced the landing hero with **“Audit your site with Vitals. See where you stand out.”**, the existing URL audit form, and a lazy-loaded React Three Fiber globe. The globe uses the exact [Earth model by Zoe XR on Poly Pizza](https://poly.pizza/m/3U-XAIY031u), licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); its attribution is in the site footer. The asset has two separate color materials and no textures; code recolors ocean to graphite-soft and land to steel-highlight.
- The completed-audit state adds the site's amber pin, short rings/beam, dim comparison sites, eased orientation, and score label. Dragging tilts/rotates; scrolling adjusts zoom/rotation. Reduced-motion, WebGL-unavailable, and low-power/save-data contexts use a static steel-and-graphite illustration.
- The canvas and model are loaded only as the hero approaches the viewport, with DPR capped at 1.5, render-loop pausing offscreen/in hidden tabs, soft lights, and cloned-material cleanup. Model compression uses Meshopt with `gltf-transform` (no texture compression or geometry simplification).
- Audit IDs are stored in the URL as `?scan=<id>` and mirrored to localStorage. Readout and Assistant restore their scan (and Assistant chat history) from Supabase, provide no-scan/invalid-scan empty states, and link between the three flows. Assistant opens with the saved audit context and suggested questions.
- While an audit is running, `/api/tips` requests a varied batch from Gemini Flash using the existing server-side Gemini key. The client deduplicates tips for the browser session, prefetches before the batch ends, and uses a small static pool only when the API fails or is slow.

### Performance note — one local production check

- **Lighthouse (desktop, local production build): 100/100 performance**, FCP **0.2 s**, LCP **0.6 s**, TBT **70 ms**, CLS **0**. Reported total transfer was **507 KiB**; the run observed 11 script requests totaling **418,190 bytes** transferred. The hero was in/near the first viewport, so the deferred R3F chunk was eligible to load during this run; the canvas remains a separate lazy chunk and the form is usable independently.
- **Mobile viewport simulation (390 × 844):** no horizontal overflow, WebGL canvas loaded, no page errors, and **60 fps** over a 2.5-second `requestAnimationFrame` sample using headless Chromium/SwiftShader. This is a software-rendered viewport check, not a claim about every physical phone/GPU.
- **Earth model:** **71,164 B → 17,260 B** (**75.7% smaller**, about 69.5 KiB → 16.9 KiB) with Meshopt; 1,952 vertices, 960 triangles, two independent materials, no texture. No heavy postprocessing or permanent amber glow is used.

### Configuration

Set these values in `.env.local` for local development and in **Vercel → Project Settings → Environment Variables** for Preview/Production. Do not commit secrets:

- `VITALS_GEMINI_API_KEY` — server-only Gemini key used by chat and `/api/tips`.
- `VITALS_PAGESPEED_API_KEY` — server-only Google PageSpeed Insights key.
- `NEXT_PUBLIC_VITALS_SUPABASE_URL` — Supabase project URL.
- `VITALS_SUPABASE_ANON_KEY` — Supabase anon key (the existing client also accepts `NEXT_PUBLIC_VITALS_SUPABASE_ANON_KEY` as a fallback; use the same anon key). The anon key is subject to the project's Supabase RLS policies.

No `.env.local` file or credentials were present in the checked-out workspace; set the existing project's values in those locations. The tips route uses `VITALS_GEMINI_API_KEY`; it does not expose the key to the browser.

### With more time

I would add device-level profiling across actual mobile GPUs, an accessible keyboard alternative for globe pin inspection, and integration tests using a seeded Supabase scan/chat fixture. Optional calibration tick marks were omitted because the referenced `DESIGN.md` was not present in the repository; the explicit globe design rules supplied in the task were followed without adding colors or a theme switch.
