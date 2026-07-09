/* End-to-end check of the core engine against a running dev server:
 * upload → process → poll status → assert new current snapshot.
 * Run: node scripts/e2e-upload.mjs mocks/mock_jun_2025.csv "Jun 2025"
 */
import { readFileSync } from "fs";
import path from "path";

const base = process.env.APP_URL || "http://localhost:3000";
const [, , filePath, periodLabel] = process.argv;

const bytes = readFileSync(filePath);
const form = new FormData();
form.append("file", new Blob([bytes]), path.basename(filePath));
form.append("period_label", periodLabel);

const upRes = await fetch(`${base}/api/upload`, { method: "POST", body: form });
const upBody = await upRes.json();
console.log("upload:", upRes.status, JSON.stringify(upBody).slice(0, 200));
if (!upRes.ok) process.exit(1);
const uploadId = upBody.upload.id;

const procRes = await fetch(`${base}/api/process/${uploadId}`, { method: "POST" });
const procBody = await procRes.json();
console.log("process:", procRes.status, JSON.stringify(procBody).slice(0, 300));

const stRes = await fetch(`${base}/api/uploads/${uploadId}`);
const stBody = await stRes.json();
console.log("status:", stBody.upload?.status, stBody.upload?.error_message ?? "");
