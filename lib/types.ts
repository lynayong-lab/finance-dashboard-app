export type UploadStatus = "pending" | "processing" | "complete" | "error";
export type RagStatus = "red" | "amber" | "green";
export type FlagType = "billing_delay" | "overrun" | "high_wip";

export interface FinanceUpload {
  id: string;
  user_id: string | null;
  file_name: string;
  storage_path: string;
  period_label: string;
  status: UploadStatus;
  error_message: string | null;
  created_at: string;
}

export interface DashboardSnapshot {
  id: string;
  user_id: string | null;
  upload_id: string | null;
  period_label: string;
  ebit_actual: number;
  ebit_budget: number;
  ebit_variance: number;
  gross_profit_pct: number;
  total_fee_revenue: number;
  is_current: boolean;
  created_at: string;
}

export interface TeamMetric {
  id: string;
  user_id: string | null;
  snapshot_id: string;
  team_name: string;
  fee_revenue: number;
  gross_profit_pct: number;
  rag_status: RagStatus;
  rag_reason: string | null;
  rag_status_source: string;
  rag_status_confidence: number;
  rag_status_review_status: string;
  created_at: string;
}

export interface ProjectFlag {
  id: string;
  user_id: string | null;
  snapshot_id: string;
  project_code: string;
  project_name: string;
  team_name: string;
  flag_type: FlagType;
  wip_value: number | null;
  overrun_pct: number | null;
  rag_status: RagStatus;
  notes: string | null;
  created_at: string;
}

/** Structured output of the parse engine (see docs/INTELLIGENCE_LAYER.md). */
export interface ParsedExport {
  period_label: string;
  ebit_actual: number;
  ebit_budget: number;
  gross_profit_pct: number;
  teams: ParsedTeam[];
  project_flags: ParsedProjectFlag[];
}

export interface ParsedTeam {
  team_name: string;
  fee_revenue: number;
  gross_profit_pct: number;
  ebit_actual: number | null;
  ebit_budget: number | null;
  rag_status: RagStatus;
  rag_reason: string | null;
}

export interface ParsedProjectFlag {
  project_code: string;
  project_name: string;
  team_name: string;
  flag_type: FlagType;
  wip_value: number | null;
  wip_age_days: number | null;
  overrun_pct: number | null;
  rag_status: RagStatus;
  notes: string | null;
}
