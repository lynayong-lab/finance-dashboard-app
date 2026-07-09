import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(process.argv[2], "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

for (const table of ["finance_uploads", "dashboard_snapshots", "team_metrics", "project_flags", "audit_logs"]) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  console.log(table, error ? `ERROR: ${error.message}` : `ok (${count} rows)`);
}

const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
console.log("buckets:", bErr ? `ERROR: ${bErr.message}` : JSON.stringify(buckets?.map((b) => b.name)));

// Can anon write? (permissive v1 RLS should allow)
const { data: ins, error: insErr } = await supabase
  .from("audit_logs")
  .insert({ action: "connectivity_check", object_type: "system" })
  .select()
  .single();
console.log("anon insert:", insErr ? `ERROR: ${insErr.message}` : "ok " + ins.id);

// storage upload probe
const { error: upErr } = await supabase.storage
  .from("finance-exports")
  .upload(`probe/probe-${Date.now()}.txt`, new Blob(["probe"]), { contentType: "text/plain" });
console.log("storage upload:", upErr ? `ERROR: ${upErr.message}` : "ok");
