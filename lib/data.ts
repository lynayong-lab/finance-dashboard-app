import { createClient } from "@/lib/supabase/server";
import type { DashboardSnapshot, ProjectFlag, TeamMetric } from "@/lib/types";

export interface TrendPoint {
  period_label: string;
  ebit_actual: number;
  ebit_budget: number;
  created_at: string;
}

export interface DashboardData {
  snapshot: DashboardSnapshot;
  teams: TeamMetric[];
  flags: ProjectFlag[];
  trend: TrendPoint[];
}

/**
 * Loads everything the one-page dashboard needs. With no argument it loads the
 * `is_current` snapshot; pass a snapshot id to view a historical one.
 * Returns null when no snapshot exists (empty state).
 */
export async function getDashboardData(
  snapshotId?: string,
): Promise<DashboardData | null> {
  const supabase = await createClient();

  let snapshot: DashboardSnapshot | null = null;
  if (snapshotId) {
    const { data } = await supabase
      .from("dashboard_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .maybeSingle();
    snapshot = data;
  } else {
    const { data } = await supabase
      .from("dashboard_snapshots")
      .select("*")
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    snapshot = data;
  }
  if (!snapshot) return null;

  const [teamsRes, flagsRes, trendRes] = await Promise.all([
    supabase
      .from("team_metrics")
      .select("*")
      .eq("snapshot_id", snapshot.id)
      .order("fee_revenue", { ascending: false }),
    supabase
      .from("project_flags")
      .select("*")
      .eq("snapshot_id", snapshot.id)
      .order("rag_status", { ascending: true }) // amber < green < red alphabetically; re-sorted below
      .order("created_at", { ascending: true }),
    supabase
      .from("dashboard_snapshots")
      .select("period_label, ebit_actual, ebit_budget, created_at")
      .lte("created_at", snapshot.created_at),
  ]);

  const severity = { red: 0, amber: 1, green: 2 } as const;
  const flags = ((flagsRes.data ?? []) as ProjectFlag[]).sort(
    (a, b) => severity[a.rag_status] - severity[b.rag_status],
  );

  // Chronological order for the trend. Seed rows share one created_at, so
  // sort primarily by the parsed period label ("May 2025" → date) and fall
  // back to created_at, then keep the 3 most recent up to the viewed one.
  const trend = ((trendRes.data ?? []) as TrendPoint[])
    .sort((a, b) => periodTime(a) - periodTime(b))
    .slice(-3);

  return {
    snapshot,
    teams: (teamsRes.data ?? []) as TeamMetric[],
    flags,
    trend,
  };
}

function periodTime(p: { period_label: string; created_at: string }): number {
  const parsed = Date.parse(p.period_label);
  return Number.isNaN(parsed) ? Date.parse(p.created_at) : parsed;
}

export async function listSnapshots(): Promise<DashboardSnapshot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dashboard_snapshots")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as DashboardSnapshot[];
}
