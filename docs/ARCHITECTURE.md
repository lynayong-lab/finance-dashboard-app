# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind + Recharts
- **Backend:** Next.js API routes (upload handler, parse engine)
- **Database:** Supabase (Postgres + Storage for raw files)
- **Deploy:** Vercel

## What to Build Now vs Later
**Now (v1):** upload → parse → structured metrics → dashboard render
**Next:** authentication, per-user snapshots, email share link
**Later:** PowerPoint export, live data connector, multi-region, WIP/AR sections

## Key User Action — Step by Step
1. Javier opens the app (no login) and sees the current dashboard with demo data
2. Javier clicks **Upload Export** and drops a CSV/XLSX file
3. File is stored in Supabase Storage; a `finance_uploads` row is created (`status: processing`)
4. API route parses the file: extracts EBIT, budget, GP%, fee revenue by team, flags projects
5. Parsed values are written to `team_metrics` and `project_flags`; a `dashboard_snapshots` row is created
6. Upload row is updated to `status: complete`
7. UI polls/subscribes → dashboard re-renders with live data from the new snapshot
8. James opens the URL → reads the one-pager; no login required

## Layer Plan
1. **Data layer first:** tables + seed data + storage bucket — app renders on day one
2. **Parse engine:** deterministic CSV/XLSX column-mapping logic — runs fully without AI
3. **Smart layer (later):** AI-assisted anomaly detection, narrative summaries added on top

## Why Core Runs Without AI
All metrics are direct arithmetic on the parsed export (EBIT = revenue − costs, GP% = gross profit / revenue). No AI required for v1. AI is additive.
