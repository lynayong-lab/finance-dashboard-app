# Test Plan

## v1 Success Scenario (manual)
1. Open `localhost:3000` (no login) → dashboard renders with seed data; all 4 team RAG cards visible; EBIT vs Budget card shows correct values from DB.
2. Click **Upload Export** → file picker opens.
3. Select `mock_may_2025.csv` (included in repo) → enter period label "May 2025" → click **Process**.
4. Status badge changes: `pending → processing → complete` within 10 seconds.
5. Dashboard auto-updates: EBIT actual matches CSV row, GP% matches, RAG cards reflect rule engine output.
6. Projects needing attention table shows flagged rows from CSV.
7. Navigate to `/history` → two snapshots listed (seed + new).
8. Click seed snapshot → dashboard renders seed values correctly.

## Empty State
- Delete all rows from `dashboard_snapshots` → dashboard shows "No data yet — upload a finance export to get started."
- No JS errors in console.

## Error Cases
| Scenario | Expected behaviour |
|---|---|
| Upload a non-CSV/XLSX file | Error toast: "Unsupported file type. Please upload a CSV or XLSX." |
| CSV missing required columns | Upload status → `error`; error_message displayed; old snapshot stays current |
| Network timeout during processing | Status stays `processing`; retry button appears after 30 s |
| Parse produces zero team rows | Error: "No team data found. Check column mapping." |

## RAG Rule Verification
- Seed a team with EBIT variance = −12% → confirm RAG = `red`
- Seed a team with EBIT variance = −5% → confirm RAG = `amber`
- Seed a team with EBIT variance = −1% → confirm RAG = `green`
- Seed a project with WIP > 60 days → confirm flag_type = `billing_delay`, RAG = `red`

## Audit Log Check
- After upload: `audit_logs` has row `action: upload_created`
- After parse: row `action: parse_complete`
- After RAG override: row `action: override_rag_status` with old_value and new_value
