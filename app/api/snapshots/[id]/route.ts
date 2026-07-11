import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/requireUser";

/**
 * Rename a snapshot's period label — low-risk edit, logged. Same auth gate as
 * the other write actions. Allowed on any snapshot including the current one
 * (renaming loses no data).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;

  let body: { period_label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const periodLabel = (body.period_label ?? "").trim();
  if (!periodLabel) {
    return NextResponse.json(
      { error: "Period label can’t be empty." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: snapshot } = await supabase
    .from("dashboard_snapshots")
    .select("id, period_label")
    .eq("id", id)
    .maybeSingle();
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("dashboard_snapshots")
    .update({ period_label: periodLabel })
    .eq("id", id)
    .select()
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: `Could not rename snapshot: ${error?.message}` },
      { status: 500 },
    );
  }

  await writeAuditLog(supabase, {
    action: "rename_snapshot",
    object_type: "dashboard_snapshot",
    object_id: id,
    user_id: auth.user.id,
    old_value: { period_label: snapshot.period_label },
    new_value: { period_label: periodLabel },
  });

  return NextResponse.json({ snapshot: updated });
}

/**
 * Delete a snapshot and its derived rows (team_metrics, project_flags) —
 * medium-risk action, logged (docs/AGENTIC_LAYER.md). Same auth gate as the
 * other write actions. The current snapshot cannot be deleted.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const supabase = await createClient();

  const { data: snapshot } = await supabase
    .from("dashboard_snapshots")
    .select("id, period_label, is_current")
    .eq("id", id)
    .maybeSingle();
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found." }, { status: 404 });
  }
  if (snapshot.is_current) {
    return NextResponse.json(
      { error: "The current snapshot cannot be deleted." },
      { status: 409 },
    );
  }

  // No ON DELETE CASCADE in the schema — remove children before the snapshot.
  const { error: tmErr } = await supabase
    .from("team_metrics")
    .delete()
    .eq("snapshot_id", id);
  if (tmErr) {
    return NextResponse.json(
      { error: `Could not delete team metrics: ${tmErr.message}` },
      { status: 500 },
    );
  }
  const { error: pfErr } = await supabase
    .from("project_flags")
    .delete()
    .eq("snapshot_id", id);
  if (pfErr) {
    return NextResponse.json(
      { error: `Could not delete project flags: ${pfErr.message}` },
      { status: 500 },
    );
  }
  const { error: snapErr } = await supabase
    .from("dashboard_snapshots")
    .delete()
    .eq("id", id);
  if (snapErr) {
    return NextResponse.json(
      { error: `Could not delete snapshot: ${snapErr.message}` },
      { status: 500 },
    );
  }

  await writeAuditLog(supabase, {
    action: "delete_snapshot",
    object_type: "dashboard_snapshot",
    object_id: id,
    user_id: auth.user.id,
    old_value: { period_label: snapshot.period_label },
    new_value: null,
  });

  return NextResponse.json({ ok: true });
}
