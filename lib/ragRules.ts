import type { FlagType, RagStatus } from "./types";

/**
 * Deterministic RAG rule engine (docs/INTELLIGENCE_LAYER.md — v1, no AI).
 *
 * EBIT variance vs budget:  < −10% Red · −10%..−3% Amber · > −3% Green
 * WIP age:                  > 60 days Red · 30–60 days Amber
 * Overrun:                  > 15% over budget Red
 */

export function ragFromEbitVariance(
  actual: number,
  budget: number,
): { status: RagStatus; reason: string | null } {
  if (budget === 0) return { status: "green", reason: null };
  const pct = ((actual - budget) / Math.abs(budget)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  if (pct < -10) {
    return { status: "red", reason: `EBIT variance at ${rounded}% vs budget` };
  }
  if (pct <= -3) {
    return { status: "amber", reason: `EBIT variance at ${rounded}% vs budget` };
  }
  return { status: "green", reason: null };
}

export interface ProjectSignals {
  wip_value: number | null;
  wip_age_days: number | null;
  overrun_pct: number | null;
  notes: string | null;
}

/** Returns null when no rule fires — the project is not flagged. */
export function flagFromProjectSignals(
  s: ProjectSignals,
): { flag_type: FlagType; rag_status: RagStatus; reason: string } | null {
  if (s.wip_age_days !== null && s.wip_age_days > 60) {
    return {
      flag_type: "billing_delay",
      rag_status: "red",
      reason: `Unbilled WIP aged ${s.wip_age_days} days (>60)`,
    };
  }
  if (s.overrun_pct !== null && s.overrun_pct > 15) {
    return {
      flag_type: "overrun",
      rag_status: "red",
      reason: `Fee overrun ${s.overrun_pct}% above budget (>15%)`,
    };
  }
  if (s.wip_age_days !== null && s.wip_age_days >= 30) {
    return {
      flag_type: "high_wip",
      rag_status: "amber",
      reason: `WIP aged ${s.wip_age_days} days (30–60)`,
    };
  }
  return null;
}
