# Finance Dashboard

One-click finance export → single-page leadership dashboard: **EBIT vs Budget,
GP%, EBIT trend, fee revenue by team with RAG status, and projects needing
attention.** Replaces a 3-day/month manual 55-slide deck build.

Full plan in [`/docs`](docs/PRD.md) — PRD, architecture, data model, sprints,
test plan.

## How it works

1. Open the app (no login) — the current dashboard renders from the latest
   snapshot in Supabase.
2. Click **Upload Export**, drop a CSV/XLSX (see [`mocks/`](mocks/) for the
   expected shape), enter a period label and hit **Process**.
3. The parse engine ([`lib/parseExport.ts`](lib/parseExport.ts)) extracts EBIT,
   GP%, team metrics and project signals; the deterministic RAG rule engine
   ([`lib/ragRules.ts`](lib/ragRules.ts)) scores them; a new snapshot becomes
   current and the dashboard refreshes.
4. `/history` lists every snapshot; any can be viewed or promoted back to
   current. Team RAG chips can be manually overridden (audit-logged).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Styles | Tailwind CSS v4 + Recharts |
| Data | Supabase (Postgres + Storage), schema in [`supabase/migrations`](supabase/migrations) |
| Deploy | Vercel (auto-deploys `main`) |

## Local dev

```bash
npm install
vercel link && vercel env pull .env.local
npm run dev
```

Run the parse-engine checks: `npx tsx scripts/test-parse.ts`

## Mock exports (for the demo)

| File | Purpose |
|---|---|
| `mocks/mock_may_2025.csv` | Normal month — matches the seeded May 2025 snapshot |
| `mocks/mock_jun_2025.csv` | Next month — new values, new flags |
| `mocks/mock_near_miss_jul_2025.csv` | Messy headers, `S$`/comma numbers, `(negatives)`, subtotal rows |
| `mocks/mock_error.csv` | Missing team section — exercises the error path |

## Auth (lock-down sprint)

The dashboard is public. Uploading, RAG overrides and snapshot promotion
require a signed-in user (`/login`). Write APIs check the session server-side;
`supabase/migrations/0002_lockdown.sql` closes direct anon writes at the RLS
level.
