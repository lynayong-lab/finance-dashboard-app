# Intelligence Layer

## Messy Input
Raw finance export: CSV or XLSX with inconsistent column headers, merged cells, mixed number formats, blank rows, subtotals mixed with detail rows.

## Auto-Structure Schema (parse output)
```json
{
  "period_label": "May 2025",
  "ebit_actual": 420000,
  "ebit_budget": 500000,
  "gross_profit_pct": 38.2,
  "teams": [
    {
      "team_name": "Advisory",
      "fee_revenue": 210000,
      "gross_profit_pct": 41.0,
      "rag_status": "green",
      "rag_reason": null
    }
  ],
  "project_flags": [
    {
      "project_code": "P-0042",
      "project_name": "Changi Masterplan",
      "flag_type": "billing_delay",
      "wip_value": 95000,
      "rag_status": "red"
    }
  ]
}
```

## Events to Track
- File uploaded
- Parse succeeded / failed
- RAG status changed vs prior month
- Project flag added / resolved

## Scoring Rules (v1 — fully rule-based)
| Signal | Rule | RAG |
|---|---|---|
| EBIT variance | < −10% budget | Red |
| EBIT variance | −10% to −3% | Amber |
| EBIT variance | > −3% | Green |
| WIP age | > 60 days unbilled | Red |
| WIP age | 30–60 days | Amber |
| Overrun | > 15% over budget | Red |

All AI fields store: `value`, `source` (`rule_engine`), `confidence` (1.0 for deterministic rules), `review_status` (`unreviewed`).

## v1 vs Later
**v1:** deterministic rule engine only
**Later:** LLM-generated narrative summary per snapshot; anomaly detection flagging unusual month-on-month shifts
