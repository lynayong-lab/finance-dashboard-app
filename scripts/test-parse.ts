/* Offline checks for the parse engine + RAG rules (docs/TEST_PLAN.md).
 * Run: npx tsx scripts/test-parse.ts
 */
import { readFileSync } from "fs";
import { parseExport, ParseError } from "../lib/parseExport";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`FAIL ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok   ${label}`);
  }
}

function load(name: string): ArrayBuffer {
  const buf = readFileSync(`mocks/${name}`);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// ── mock_may_2025.csv (normal) ──
const may = parseExport(load("mock_may_2025.csv"), "mock_may_2025.csv", "May 2025");
check("may period", may.period_label, "May 2025");
check("may ebit", [may.ebit_actual, may.ebit_budget], [420000, 500000]);
check("may gp", may.gross_profit_pct, 38.2);
check("may team count", may.teams.length, 4);
check(
  "may team rag",
  may.teams.map((t) => `${t.team_name}:${t.rag_status}`),
  ["Advisory:green", "Planning:amber", "Engineering:red", "Sustainability:green"],
);
check(
  "may flags",
  may.project_flags.map((f) => `${f.project_code}:${f.flag_type}:${f.rag_status}`),
  ["P-0042:billing_delay:red", "P-0078:overrun:red", "P-0091:high_wip:amber"],
);
check("may fee total", may.teams.reduce((s, t) => s + t.fee_revenue, 0), 1185000);

// ── mock_jun_2025.csv ──
const jun = parseExport(load("mock_jun_2025.csv"), "mock_jun_2025.csv", "Jun 2025");
check("jun ebit", [jun.ebit_actual, jun.ebit_budget], [468000, 500000]);
check(
  "jun team rag",
  jun.teams.map((t) => `${t.team_name}:${t.rag_status}`),
  ["Advisory:green", "Planning:amber", "Engineering:amber", "Sustainability:green"],
);
check(
  "jun flags",
  jun.project_flags.map((f) => `${f.project_code}:${f.flag_type}:${f.rag_status}`),
  ["P-0042:billing_delay:red", "P-0091:high_wip:amber", "P-0103:overrun:red"],
);

// ── mock_near_miss_jul_2025.csv (messy headers, S$ amounts, () negatives) ──
const jul = parseExport(load("mock_near_miss_jul_2025.csv"), "mock_near_miss_jul_2025.csv", "Jul 2025");
check("jul ebit", [jul.ebit_actual, jul.ebit_budget], [512000, 500000]);
check("jul gp", jul.gross_profit_pct, 40.1);
check("jul team count", jul.teams.length, 4);
check(
  "jul engineering negative ebit → red",
  jul.teams.find((t) => t.team_name === "Engineering")?.rag_status,
  "red",
);
check(
  "jul flags",
  jul.project_flags.map((f) => `${f.project_code}:${f.flag_type}:${f.rag_status}`),
  ["P-0042:high_wip:amber", "P-0110:billing_delay:red"],
);

// ── mock_error.csv (no team section) ──
try {
  parseExport(load("mock_error.csv"), "mock_error.csv", "Aug 2025");
  failures++;
  console.log("FAIL error file should throw");
} catch (e) {
  check(
    "error file message",
    e instanceof ParseError ? e.message : String(e),
    "No team data found. Check column mapping.",
  );
}

// ── unsupported extension ──
try {
  parseExport(new ArrayBuffer(4), "report.pdf");
  failures++;
  console.log("FAIL pdf should throw");
} catch (e) {
  check(
    "unsupported type message",
    e instanceof ParseError ? e.message : String(e),
    "Unsupported file type. Please upload a CSV or XLSX.",
  );
}

// ── RAG boundary checks (docs/TEST_PLAN.md) ──
import { ragFromEbitVariance } from "../lib/ragRules";
check("variance -12% → red", ragFromEbitVariance(88000, 100000).status, "red");
check("variance -5% → amber", ragFromEbitVariance(95000, 100000).status, "amber");
check("variance -1% → green", ragFromEbitVariance(99000, 100000).status, "green");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
