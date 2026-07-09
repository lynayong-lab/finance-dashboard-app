import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Status polling endpoint for the upload UI. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: upload, error } = await supabase
    .from("finance_uploads")
    .select("id, file_name, period_label, status, error_message, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!upload) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
  return NextResponse.json({ upload });
}
