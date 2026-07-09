import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/requireUser";

const BUCKET = "finance-exports";
const ALLOWED = [".csv", ".xlsx", ".xls"];

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const form = await req.formData();
    const file = form.get("file");
    const periodLabel = String(form.get("period_label") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    const lower = file.name.toLowerCase();
    if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a CSV or XLSX." },
        { status: 400 },
      );
    }
    if (!periodLabel) {
      return NextResponse.json(
        { error: "Please enter a period label (e.g. \"Jun 2025\")." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Private bucket; create on first use so a fresh Supabase project works.
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: false });
    }

    let storagePath = `uploads/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
      });
    if (storageError) {
      // No service-role key on this project means the bucket can't be
      // created via the API. Fall back to storing the raw file inline in the
      // uploads row so the core flow still works end-to-end.
      storagePath = `inline:${Buffer.from(bytes).toString("base64")}`;
    }

    const { data: upload, error: insertError } = await supabase
      .from("finance_uploads")
      .insert({
        user_id: auth.user.id,
        file_name: file.name,
        storage_path: storagePath,
        period_label: periodLabel,
        status: "pending",
      })
      .select()
      .single();
    if (insertError || !upload) {
      return NextResponse.json(
        { error: `Could not record upload: ${insertError?.message}` },
        { status: 500 },
      );
    }

    await writeAuditLog(supabase, {
      action: "upload_created",
      object_type: "finance_upload",
      object_id: upload.id,
      user_id: auth.user.id,
      new_value: {
        file_name: file.name,
        period_label: periodLabel,
        storage_path: storagePath.startsWith("inline:")
          ? "inline (no storage bucket)"
          : storagePath,
      },
    });

    return NextResponse.json({ upload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
