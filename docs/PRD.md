# PRD — Finance Dashboard App

## Problem
Javier spends ~3 days/month manually building a 55-slide finance deck. James (ED) and El Fie (OSS Director) then hunt through 55 slides to find 5 numbers. There is no fast path from raw finance export to executive-ready summary.

## Target Users
| User | Role |
|---|---|
| Javier | Uploader — drops in the monthly finance export, triggers processing |
| James | Reader (ED) — needs EBIT vs Budget, GP%, headline RAG at a glance |
| El Fie | Reader (OSS Director) — same dashboard, focus on team-level fee revenue |

## Core Objects
- **FinanceUpload** — the raw monthly export file + processing status
- **DashboardSnapshot** — the structured one-page output derived from each upload
- **TeamMetric** — fee revenue, GP%, EBIT actuals per team per period
- **ProjectFlag** — projects flagged Red/Amber/Green with reason (billing delay, overrun, high WIP)

## MVP Must-Haves (v1)
- [ ] Upload a finance export file (CSV/XLSX)
- [ ] One-click processing → parse into structured metrics
- [ ] Dashboard page: EBIT vs Budget (value + variance), GP%, EBIT trend line
- [ ] RAG status card per team with fee revenue
- [ ] Projects needing attention list (flagged rows)
- [ ] Dashboard readable without login (demo-first)
- [ ] Seed demo data matching real export shape so swap to live = zero rework

## Non-Goals (v1)
- Auto-generating PowerPoint deck
- SEA / other regions (SG only)
- WIP detail, manpower, AR, project closure sections
- Live or real company data
- Authentication / per-user access control

## Success Criteria
Javier uploads a mock finance export CSV, clicks **Process**, and within 10 seconds sees a single dashboard page with EBIT vs Budget, GP%, an EBIT trend line, and a RAG card per team — all correct, no manual editing required. James can read the full picture in under 2 minutes.
