# Security

## Secret Handling
- Supabase service-role key only in server-side API routes (never in client bundle)
- Storage bucket set to private; signed URLs generated server-side for file access
- All env vars via Vercel environment config, never committed

## Permission Model (v1 → lock-down)
| Phase | Rule |
|---|---|
| v1 demo | Permissive RLS (`using (true)`) — anyone can read/write; no login required |
| Lock-down | RLS updated to `auth.uid() = user_id`; upload restricted to `uploader` role; dashboard read open or role-gated |

## Approved Tools Rule
Only the named tools in AGENTIC_LAYER.md may write to the database. No raw `run_any` or `send_any` calls. Each tool call is logged in `audit_logs`.

## Audit Principle
Every meaningful state change (upload created, parse run, RAG status set or overridden, snapshot promoted to current) writes an `audit_logs` row. Logs are append-only; no row may be updated or deleted by the application.
