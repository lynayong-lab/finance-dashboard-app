# Agentic Layer

## Risk Levels & Actions

### Low Risk — Auto-execute
- Parse uploaded file → write structured metrics *(no approval needed)*
- Apply RAG scoring rules → write `rag_status` to team_metrics *(deterministic)*
- Mark prior snapshot `is_current = false` when new one is created

### Medium Risk — Light Approval (v1 scope: log only; approval UI in Next sprint)
- Override a RAG status manually (Javier changes Red → Amber with note)
- Archive / delete a snapshot

### High Risk — Always Approval
- Send dashboard share link via email *(deferred to Next)*

### Critical — Human Only
- Permanently delete upload + all derived metrics
- Any write to historical snapshots already shared with leadership

## Named Tools (v1)
| Tool | Trigger | Risk |
|---|---|---|
| `parse_finance_export` | File upload complete | Low |
| `apply_rag_rules` | Parse complete | Low |
| `set_current_snapshot` | New snapshot created | Low |
| `override_rag_status` | Manual user edit | Medium |

## Audit Log Fields
`id, user_id, action, object_type, object_id, old_value (json), new_value (json), created_at`

## v1 vs Later
**v1:** `parse_finance_export` + `apply_rag_rules` run automatically on upload; all others are future.
**Later:** LLM narrative tool, email-share tool (high-risk approval flow).
