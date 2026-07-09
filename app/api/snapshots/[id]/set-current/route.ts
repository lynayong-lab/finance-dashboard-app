import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";

/**
 * set_current_snapshot triggered manually from the history page —
 * medium-risk action, logged (docs/AGENTIC_LAYER.md).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: snapshot } = await supabase
    .from("dashboard_snapshots")
    .select("id, period_label, is_current")
    .eq("id", id)
    .maybeSingle();
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
  }
  if (snapshot.is_current) {
    return NextResponse.json({ snapshot });
  }

  const { data: prior } = await supabase
    .from("dashboard_snapshots")
    .select("id, period_label")
    .eq("is_current", true);

  await supabase
    .from("dashboard_snapshots")
    .update({ is_current: false })
    .eq("is_current", true);
  const { data: updated, error } = await supabase
    .from("dashboard_snapshots")
    .update({ is_current: true })
    .eq("id", id)
    .select()
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: `Could not set current: ${error?.message}` },
      { status: 500 },
    );
  }

  await writeAuditLog(supabase, {
    action: "set_current_snapshot",
    object_type: "dashboard_snapshot",
    object_id: id,
    old_value: prior && prior.length > 0 ? { previous_current: prior } : null,
    new_value: { period_label: snapshot.period_label },
  });

  return NextResponse.json({ snapshot: updated });
}
