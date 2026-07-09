import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { ParseError, parseExport } from "@/lib/parseExport";
import { requireUser } from "@/lib/requireUser";

const BUCKET = "finance-exports";

/**
 * Core engine: parse_finance_export + apply_rag_rules + set_current_snapshot
 * (docs/AGENTIC_LAYER.md — all low-risk, auto-executed). On parse failure the
 * upload is marked `error` and the prior snapshot stays current.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { uploadId } = await params;
  const supabase = await createClient();

  const { data: upload } = await supabase
    .from("finance_uploads")
    .select("*")
    .eq("id", uploadId)
    .maybeSingle();
  if (!upload) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  if (upload.status === "processing") {
    return NextResponse.json({ error: "Already processing." }, { status: 409 });
  }

  await supabase
    .from("finance_uploads")
    .update({ status: "processing", error_message: null })
    .eq("id", uploadId);

  try {
    let fileBuffer: ArrayBuffer;
    if (upload.storage_path.startsWith("inline:")) {
      // Fallback path: raw file was stored inline (no storage bucket available).
      const buf = Buffer.from(upload.storage_path.slice("inline:".length), "base64");
      fileBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } else {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(upload.storage_path);
      if (downloadError || !blob) {
        throw new ParseError(
          `Could not read the uploaded file from storage: ${downloadError?.message}`,
        );
      }
      fileBuffer = await blob.arrayBuffer();
    }

    const parsed = parseExport(fileBuffer, upload.file_name, upload.period_label);

    // Write the snapshot (not yet current).
    const { data: snapshot, error: snapError } = await supabase
      .from("dashboard_snapshots")
      .insert({
        upload_id: upload.id,
        period_label: parsed.period_label,
        ebit_actual: parsed.ebit_actual,
        ebit_budget: parsed.ebit_budget,
        ebit_variance: parsed.ebit_actual - parsed.ebit_budget,
        gross_profit_pct: parsed.gross_profit_pct,
        total_fee_revenue: parsed.teams.reduce((s, t) => s + t.fee_revenue, 0),
        is_current: false,
      })
      .select()
      .single();
    if (snapError || !snapshot) {
      throw new Error(`Could not write snapshot: ${snapError?.message}`);
    }

    if (parsed.teams.length > 0) {
      const { error } = await supabase.from("team_metrics").insert(
        parsed.teams.map((t) => ({
          snapshot_id: snapshot.id,
          team_name: t.team_name,
          fee_revenue: t.fee_revenue,
          gross_profit_pct: t.gross_profit_pct,
          rag_status: t.rag_status,
          rag_reason: t.rag_reason,
          rag_status_source: "rule_engine",
          rag_status_confidence: 1.0,
          rag_status_review_status: "unreviewed",
        })),
      );
      if (error) throw new Error(`Could not write team metrics: ${error.message}`);
    }

    if (parsed.project_flags.length > 0) {
      const { error } = await supabase.from("project_flags").insert(
        parsed.project_flags.map((f) => ({
          snapshot_id: snapshot.id,
          project_code: f.project_code,
          project_name: f.project_name,
          team_name: f.team_name,
          flag_type: f.flag_type,
          wip_value: f.wip_value,
          overrun_pct: f.overrun_pct,
          rag_status: f.rag_status,
          notes: f.notes,
        })),
      );
      if (error) throw new Error(`Could not write project flags: ${error.message}`);
    }

    // set_current_snapshot: flip prior current off, promote the new one.
    const { data: prior } = await supabase
      .from("dashboard_snapshots")
      .select("id, period_label")
      .eq("is_current", true)
      .neq("id", snapshot.id);
    await supabase
      .from("dashboard_snapshots")
      .update({ is_current: false })
      .eq("is_current", true);
    await supabase
      .from("dashboard_snapshots")
      .update({ is_current: true })
      .eq("id", snapshot.id);

    await supabase
      .from("finance_uploads")
      .update({ status: "complete" })
      .eq("id", uploadId);

    await writeAuditLog(supabase, {
      action: "parse_complete",
      object_type: "dashboard_snapshot",
      object_id: snapshot.id,
      user_id: auth.user.id,
      old_value: prior && prior.length > 0 ? { previous_current: prior } : null,
      new_value: {
        upload_id: upload.id,
        period_label: parsed.period_label,
        ebit_actual: parsed.ebit_actual,
        ebit_budget: parsed.ebit_budget,
        teams: parsed.teams.length,
        project_flags: parsed.project_flags.length,
      },
    });

    return NextResponse.json({ status: "complete", snapshot_id: snapshot.id });
  } catch (err) {
    const message =
      err instanceof ParseError
        ? err.message
        : err instanceof Error
          ? `Processing failed: ${err.message}`
          : "Processing failed.";

    await supabase
      .from("finance_uploads")
      .update({ status: "error", error_message: message })
      .eq("id", uploadId);

    await writeAuditLog(supabase, {
      action: "parse_failed",
      object_type: "finance_upload",
      object_id: uploadId,
      user_id: auth.user.id,
      new_value: { error: message },
    });

    return NextResponse.json({ status: "error", error: message }, { status: 422 });
  }
}
