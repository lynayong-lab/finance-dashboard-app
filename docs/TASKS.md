# Tasks & Sprints

## Sprint 1 — Data Foundation + Seed Dashboard *(viewable without login)*
**Goal:** App renders a real-looking dashboard from seed data on first visit.
- [ ] Create Supabase project + Storage bucket (`finance-exports`)
- [ ] Run migration SQL: all four tables + RLS v1 permissive policies
- [ ] Seed 1 demo snapshot (May 2025), 4 team_metrics rows, 3 project_flags rows
- [ ] Next.js app scaffold: Tailwind, Recharts, Supabase client
- [ ] Dashboard page (`/`) reads `is_current = true` snapshot and renders:
  - EBIT vs Budget card (value, variance, % diff)
  - GP% card
  - EBIT trend line (last 3 periods from seed)
  - RAG card per team
  - Projects needing attention table
- [ ] Empty state if no snapshot exists
- [ ] Loading skeleton while fetching

**Definition of Done:** `localhost:3000` shows the full dashboard with seed data; no login required; all cards display correct numbers from the database.

---

## Sprint 2 — Core Engine: Upload → Parse → Dashboard *(v1 functional milestone)*
**Goal:** Javier uploads a CSV, clicks Process, dashboard updates. This is the working app.
- [ ] Upload UI: drag-and-drop / file picker, period label input, **Process** button
- [ ] API route `POST /api/upload`: store file in Supabase Storage, create `finance_uploads` row (`status: pending`)
- [ ] Parse engine (`lib/parseExport.ts`): read CSV/XLSX, map columns to structured schema, handle blank rows + subtotals
- [ ] API route `POST /api/process/:uploadId`: run parse engine → write `dashboard_snapshots`, `team_metrics`, `project_flags`; apply RAG rules; set `is_current = true`; flip prior snapshot
- [ ] Upload status polling on UI (pending → processing → complete / error)
- [ ] Dashboard auto-refreshes after processing completes
- [ ] Error state: show parse error message, keep old snapshot current
- [ ] Write `audit_logs` rows for upload + parse events
- [ ] Test with 3 different mock CSVs (normal, near-miss, error file)

**Definition of Done:** Upload a mock CSV → click Process → dashboard shows updated EBIT, GP%, RAG cards within 10 seconds. Old snapshot is preserved. Error file shows error message without breaking dashboard.

---

## Sprint 3 — RAG Override + Snapshot History
**Goal:** Javier can correct a RAG status; James can see prior months.
- [ ] Inline RAG override: click status chip → dropdown → save with note
- [ ] Override writes `audit_logs` row (`action: override_rag_status`)
- [ ] Snapshot history page (`/history`): list all snapshots, click to view
- [ ] "Set as Current" button on history page (medium-risk, logs action)
- [ ] Display `review_status` badge on overridden RAG items

**Definition of Done:** Override a team's RAG status → badge updates → audit log row exists. History page lists all snapshots.

---

## Sprint 4 — Lock It Down *(auth + per-user isolation)*
**Goal:** Only authenticated users can upload; readers see dashboard without login.
- [ ] Supabase Auth: email/password for Javier
- [ ] Replace permissive RLS with owner-scoped policies on write tables
- [ ] Upload page gated: redirect to `/login` if not authenticated
- [ ] Dashboard (`/`) remains public (read-only, no login required)
- [ ] Session management (login, logout)
- [ ] Validate no secrets exposed in client bundle

**Definition of Done:** Unauthenticated user can view dashboard but cannot upload. Javier logs in, uploads, logs out — session is clean.

---

## Gantt (Sprint → Feature)
```
Sprint 1 │ DB schema, seed data, dashboard render
Sprint 2 │ Upload UI, parse engine, process API, live dashboard update  ← v1 functional
Sprint 3 │ RAG override, snapshot history
Sprint 4 │ Auth, RLS lock-down
```
