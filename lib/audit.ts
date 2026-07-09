import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Append-only audit log (docs/SECURITY.md). Every meaningful state change
 * writes a row; failures are logged but never break the main action.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: {
    action: string;
    object_type: string;
    object_id?: string | null;
    old_value?: unknown;
    new_value?: unknown;
    user_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    action: entry.action,
    object_type: entry.object_type,
    object_id: entry.object_id ?? null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
    user_id: entry.user_id ?? null,
  });
  if (error) {
    console.error("audit_logs insert failed:", error.message);
  }
}
