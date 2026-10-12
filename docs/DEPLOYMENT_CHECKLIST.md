# Deployment checklist

Production app: [https://vitals-red-six.vercel.app/](https://vitals-red-six.vercel.app/)  
GitHub: [https://github.com/pughal-36/Vitals](https://github.com/pughal-36/Vitals)  
Platform: Vercel (Next.js 16 App Router). CI: GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on `push`/`pull_request` to `main`.

## Pre-deploy

- [x] `npm test` passes locally (28 tests / 6 files, verified 2026-10-12)
- [x] `npm run build` succeeds locally (Next.js 16.3.5 Turbopack, verified 2026-10-12)
- [x] `.env.example` lists every variable the code reads
- [x] No API keys committed (placeholder values only in `.env.example`)
- [ ] GitHub Actions CI is green on `main`
- [ ] Playwright e2e (`npm run test:e2e`) has been run against a build with real Supabase secrets in CI

## Vercel environment variables

Set these in Vercel → Project → Settings → Environment Variables for Production (and Preview if you want scans/chat to work on preview deploys):

| Variable | Required | Notes |
| --- | --- | --- |
| `VITALS_PAGESPEED_API_KEY` | Yes | Server-only. PageSpeed Insights. |
| `VITALS_GEMINI_API_KEY` | Yes | Server-only. Gemini Flash. |
| `NEXT_PUBLIC_VITALS_SUPABASE_URL` | Yes | Public project URL. |
| `NEXT_PUBLIC_VITALS_SUPABASE_ANON_KEY` | Yes | Public anon key. |
| `VITALS_SUPABASE_ANON_KEY` | Optional | Alias if the `NEXT_PUBLIC_` anon key is unset. |
| `VITALS_SUPABASE_URL` | Optional | Alias used by the server client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only. Scan writes. |
| `ENABLE_SABOTAGE` | No | Must stay unset or `false` in production. |

- [ ] All required keys are set on the Production environment
- [ ] `ENABLE_SABOTAGE` is not `true` in Production
- [ ] Service role key is not exposed as a `NEXT_PUBLIC_` variable

## Database

- [ ] Migration [`supabase/migrations/20261008220000_scan_status.sql`](../supabase/migrations/20261008220000_scan_status.sql) has been applied on the production Supabase project
- [ ] RLS policies allow the service role to insert/update scans and chat messages as the app expects

The app degrades if the extra scan-status columns are missing: pipeline fields can be packed into `raw_categories`. Confirm this only if you cannot apply the migration before a release.

## Post-deploy smoke test

- [ ] `https://vitals-red-six.vercel.app/` loads
- [ ] Skip-to-content link appears on first Tab
- [ ] Submitting `https://example.com` creates a scan and reaches Readout
- [ ] Assistant streams a reply for that scan
- [ ] Invalid URL and Readout-with-no-scan show empty/error copy (not a blank page)
- [ ] `/about` credits still list Earth model, fonts, and APIs

## Rollback

1. In Vercel, open the project Deployments list.
2. Promote the last known-good Production deployment (redeploy that build).
3. If the failure is data-related, do not roll the schema back unless you have a matching app version; the scan-status migration is additive.

## Monitoring

There is no separate APM in this repo. Operational checks are: Vercel deployment status, GitHub Actions on `main`, and a manual smoke of Audit → Readout → Assistant after each production deploy.
