import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/requireUser";

const VALID = ["red", "amber", "green"];

/**
 * override_rag_status — medium-risk manual action (docs/AGENTIC_LAYER.md).
 * v1 scope: execute + audit log with old/new values.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  let body: { rag_status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const newStatus = body.rag_status;
  const note = (body.note ?? "").trim();
  if (!newStatus || !VALID.includes(newStatus)) {
    return NextResponse.json(
      { error: "rag_status must be red, amber or green." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: metric } = await supabase
    .from("team_metrics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!metric) {
    return NextResponse.json({ error: "Team metric not found." }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("team_metrics")
    .update({
      rag_status: newStatus,
      rag_reason: note || metric.rag_reason,
      rag_status_source: "manual_override",
      rag_status_confidence: 1.0,
      rag_status_review_status: "overridden",
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: `Override failed: ${error?.message}` },
      { status: 500 },
    );
  }

  await writeAuditLog(supabase, {
    action: "override_rag_status",
    object_type: "team_metric",
    object_id: id,
    user_id: auth.user.id,
    old_value: {
      rag_status: metric.rag_status,
      rag_reason: metric.rag_reason,
      rag_status_source: metric.rag_status_source,
    },
    new_value: {
      rag_status: newStatus,
      rag_reason: note || metric.rag_reason,
      rag_status_source: "manual_override",
    },
  });

  return NextResponse.json({ metric: updated });
}
