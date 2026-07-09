/* Tidy demo data after end-to-end testing: drop test/error snapshots and
 * uploads, promote a clean recent month to current. */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Remove snapshots whose label marks them as a test run.
const { data: snaps } = await s.from("dashboard_snapshots").select("id, period_label");
const testSnaps = (snaps ?? []).filter((x) => /live test|test\)/i.test(x.period_label));
for (const sn of testSnaps) {
  await s.from("team_metrics").delete().eq("snapshot_id", sn.id);
  await s.from("project_flags").delete().eq("snapshot_id", sn.id);
  await s.from("dashboard_snapshots").delete().eq("id", sn.id);
  console.log("deleted test snapshot:", sn.period_label);
}

// Remove uploads that errored out (from the deliberate error-file test).
const { data: badUploads } = await s.from("finance_uploads").select("id, period_label, status").eq("status", "error");
for (const u of badUploads ?? []) {
  await s.from("finance_uploads").delete().eq("id", u.id);
  console.log("deleted errored upload:", u.period_label);
}

// Promote the most recent real month to current (prefer Jun 2025).
const { data: remaining } = await s
  .from("dashboard_snapshots")
  .select("id, period_label, created_at")
  .order("created_at", { ascending: false });
const pick = (remaining ?? []).find((x) => /jun 2025/i.test(x.period_label)) ?? remaining?.[0];
if (pick) {
  await s.from("dashboard_snapshots").update({ is_current: false }).eq("is_current", true);
  await s.from("dashboard_snapshots").update({ is_current: true }).eq("id", pick.id);
  console.log("current snapshot →", pick.period_label);
}

const { data: finalList } = await s
  .from("dashboard_snapshots").select("period_label, is_current").order("created_at", { ascending: true });
console.log("snapshots:", (finalList ?? []).map((x) => x.period_label + (x.is_current ? " [current]" : "")).join(", "));
