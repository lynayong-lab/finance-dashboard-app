# Data Model

## finance_uploads
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NULL | owner-scoping at lock-down |
| file_name | text | original filename |
| storage_path | text | Supabase Storage path |
| period_label | text | e.g. "May 2025" |
| status | text | `pending` / `processing` / `complete` / `error` |
| error_message | text NULL | parse error detail |
| created_at | timestamptz | |

## dashboard_snapshots
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NULL | |
| upload_id | uuid FK → finance_uploads | |
| period_label | text | |
| ebit_actual | numeric | |
| ebit_budget | numeric | |
| ebit_variance | numeric | derived: actual − budget |
| gross_profit_pct | numeric | |
| total_fee_revenue | numeric | |
| is_current | boolean | only one true at a time |
| created_at | timestamptz | |

## team_metrics
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NULL | |
| snapshot_id | uuid FK → dashboard_snapshots | |
| team_name | text | |
| fee_revenue | numeric | |
| gross_profit_pct | numeric | |
| rag_status | text | `red` / `amber` / `green` |
| rag_reason | text NULL | |
| rag_status_source | text | `rule_engine` |
| rag_status_confidence | numeric | 0–1 |
| rag_status_review_status | text | default `unreviewed` |
| created_at | timestamptz | |

## project_flags
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NULL | |
| snapshot_id | uuid FK → dashboard_snapshots | |
| project_code | text | |
| project_name | text | |
| team_name | text | |
| flag_type | text | `billing_delay` / `overrun` / `high_wip` |
| wip_value | numeric NULL | |
| overrun_pct | numeric NULL | |
| rag_status | text | `red` / `amber` / `green` |
| notes | text NULL | |
| created_at | timestamptz | |

## RLS
All tables: RLS enabled. v1 permissive policies (select/all using true). Lock-down sprint replaces with `auth.uid() = user_id`.
