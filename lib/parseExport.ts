import * as XLSX from "xlsx";
import type { ParsedExport, ParsedProjectFlag, ParsedTeam } from "./types";
import { flagFromProjectSignals, ragFromEbitVariance } from "./ragRules";

/**
 * Deterministic parse engine for the monthly finance export
 * (docs/INTELLIGENCE_LAYER.md). Accepts CSV or XLSX with messy real-world
 * structure: title rows, blank rows, section headings, subtotal rows,
 * currency symbols and thousands separators, inconsistent header casing.
 *
 * Expected sections (order-insensitive, names matched fuzzily):
 *   SUMMARY            → Metric / Actual / Budget rows incl. EBIT + GP%
 *   TEAM PERFORMANCE   → Team / Fee Revenue / GP % / EBIT Actual / EBIT Budget
 *   PROJECT WATCHLIST  → Project Code / Name / Team / WIP Value / WIP Age Days / Overrun %
 */

export class ParseError extends Error {}

// ── Cell/row helpers ─────────────────────────────────────────────────────────

type Row = string[];

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_/%().-]+/g, " ").trim();
}

/** "S$1,234.50", "(4,200)", "18.5%" → number. Returns null when not numeric. */
function toNumber(raw: string): number | null {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim();
  if (s === "" || s === "-" || s === "–") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[sS]\$|SGD|USD|\$|,|%|\s/g, "");
  if (s.startsWith("-") || s.startsWith("−")) {
    negative = true;
    s = s.slice(1);
  }
  if (s === "" || isNaN(Number(s))) return null;
  return negative ? -Number(s) : Number(s);
}

function isBlankRow(row: Row): boolean {
  return row.every((c) => String(c ?? "").trim() === "");
}

function isSubtotalRow(row: Row): boolean {
  const first = norm(String(row[0] ?? ""));
  return ["total", "subtotal", "grand total", "sum"].includes(first);
}

// ── CSV → rows (handles quoted fields, CRLF) ────────────────────────────────

export function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, ""); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ── File → rows ─────────────────────────────────────────────────────────────

export function fileToRows(buffer: ArrayBuffer, fileName: string): Row[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(new TextDecoder("utf-8").decode(buffer));
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
    return aoa.map((r) => r.map((c) => String(c ?? "")));
  }
  throw new ParseError("Unsupported file type. Please upload a CSV or XLSX.");
}

// ── Section discovery ───────────────────────────────────────────────────────

interface Section {
  header: Row;
  rows: Row[];
}

/**
 * Splits the sheet into sections. A section starts at a row whose first cell
 * matches one of the given keywords; its header is the next non-blank row and
 * its data rows run until the next blank row followed by a section start (or EOF).
 */
function findSection(rows: Row[], keywords: string[]): Section | null {
  const isSectionTitle = (row: Row, kws: string[]) => {
    const first = norm(String(row[0] ?? ""));
    return kws.some((k) => first.includes(k)) &&
      row.slice(1).every((c) => String(c ?? "").trim() === "");
  };
  const allSectionKeywords = ["summary", "team", "project"];
  for (let i = 0; i < rows.length; i++) {
    if (!isSectionTitle(rows[i], keywords)) continue;
    // header = next non-blank row
    let h = i + 1;
    while (h < rows.length && isBlankRow(rows[h])) h++;
    if (h >= rows.length) return null;
    const header = rows[h];
    const data: Row[] = [];
    for (let j = h + 1; j < rows.length; j++) {
      if (isSectionTitle(rows[j], allSectionKeywords)) break;
      if (isBlankRow(rows[j])) continue;
      data.push(rows[j]);
    }
    return { header, rows: data };
  }
  return null;
}

/** Index of the header column whose normalized text contains all given words. */
function colIndex(header: Row, ...candidates: string[][]): number {
  for (const words of candidates) {
    const idx = header.findIndex((h) => {
      const n = norm(String(h ?? ""));
      return words.every((w) => n.includes(w));
    });
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Main entry ──────────────────────────────────────────────────────────────

export function parseExport(
  buffer: ArrayBuffer,
  fileName: string,
  periodLabelOverride?: string,
): ParsedExport {
  const rows = fileToRows(buffer, fileName);
  if (rows.length === 0) throw new ParseError("The file is empty.");

  // Period: explicit UI label wins, else a "Period" row anywhere in the sheet.
  let period_label = periodLabelOverride?.trim() || "";
  if (!period_label) {
    for (const row of rows) {
      if (norm(String(row[0] ?? "")) === "period" && String(row[1] ?? "").trim()) {
        period_label = String(row[1]).trim();
        break;
      }
    }
  }
  if (!period_label) {
    throw new ParseError(
      'No period found. Enter a period label or include a "Period" row in the file.',
    );
  }

  // ── SUMMARY ──
  const summary = findSection(rows, ["summary"]);
  if (!summary) {
    throw new ParseError('Missing "SUMMARY" section. Check column mapping.');
  }
  let ebit_actual: number | null = null;
  let ebit_budget: number | null = null;
  let gross_profit_pct: number | null = null;
  const metricCol = 0;
  const actualCol = Math.max(colIndex(summary.header, ["actual"]), 1);
  const budgetCol = Math.max(colIndex(summary.header, ["budget"]), 2);
  for (const row of summary.rows) {
    const metric = norm(String(row[metricCol] ?? ""));
    if (metric === "ebit") {
      ebit_actual = toNumber(String(row[actualCol] ?? ""));
      ebit_budget = toNumber(String(row[budgetCol] ?? ""));
    } else if (metric.includes("gross profit") || metric === "gp") {
      gross_profit_pct = toNumber(String(row[actualCol] ?? ""));
    }
  }
  if (ebit_actual === null || ebit_budget === null) {
    throw new ParseError(
      "EBIT Actual/Budget not found in SUMMARY section. Check column mapping.",
    );
  }
  if (gross_profit_pct === null) {
    throw new ParseError(
      "Gross Profit % not found in SUMMARY section. Check column mapping.",
    );
  }

  // ── TEAMS ──
  const teamSection = findSection(rows, ["team"]);
  if (!teamSection) {
    throw new ParseError("No team data found. Check column mapping.");
  }
  const th = teamSection.header;
  const tName = Math.max(colIndex(th, ["team"]), 0);
  const tFee = colIndex(th, ["fee", "revenue"], ["revenue"], ["fee"]);
  const tGp = colIndex(th, ["gp"], ["gross", "profit"]);
  const tEbitA = colIndex(th, ["ebit", "actual"]);
  const tEbitB = colIndex(th, ["ebit", "budget"]);
  if (tFee === -1 || tGp === -1) {
    throw new ParseError(
      "Team section is missing Fee Revenue or GP % columns. Check column mapping.",
    );
  }

  const teams: ParsedTeam[] = [];
  for (const row of teamSection.rows) {
    if (isSubtotalRow(row)) continue;
    const name = String(row[tName] ?? "").trim();
    const fee = toNumber(String(row[tFee] ?? ""));
    const gp = toNumber(String(row[tGp] ?? ""));
    if (!name || fee === null || gp === null) continue; // skip malformed rows
    const ea = tEbitA !== -1 ? toNumber(String(row[tEbitA] ?? "")) : null;
    const eb = tEbitB !== -1 ? toNumber(String(row[tEbitB] ?? "")) : null;
    const rag =
      ea !== null && eb !== null
        ? ragFromEbitVariance(ea, eb)
        : { status: "green" as const, reason: null };
    teams.push({
      team_name: name,
      fee_revenue: fee,
      gross_profit_pct: gp,
      ebit_actual: ea,
      ebit_budget: eb,
      rag_status: rag.status,
      rag_reason: rag.reason,
    });
  }
  if (teams.length === 0) {
    throw new ParseError("No team data found. Check column mapping.");
  }

  // ── PROJECTS (optional section) ──
  const project_flags: ParsedProjectFlag[] = [];
  const projSection = findSection(rows, ["project"]);
  if (projSection) {
    const ph = projSection.header;
    const pCode = Math.max(colIndex(ph, ["code"]), 0);
    const pName = colIndex(ph, ["name"], ["project"]);
    const pTeam = colIndex(ph, ["team"]);
    const pWip = colIndex(ph, ["wip", "value"], ["wip"]);
    const pAge = colIndex(ph, ["age"], ["days"]);
    const pOver = colIndex(ph, ["overrun"]);
    const pNotes = colIndex(ph, ["note"], ["comment"]);
    for (const row of projSection.rows) {
      if (isSubtotalRow(row)) continue;
      const code = String(row[pCode] ?? "").trim();
      if (!code) continue;
      const signals = {
        wip_value: pWip !== -1 ? toNumber(String(row[pWip] ?? "")) : null,
        wip_age_days: pAge !== -1 ? toNumber(String(row[pAge] ?? "")) : null,
        overrun_pct: pOver !== -1 ? toNumber(String(row[pOver] ?? "")) : null,
        notes: pNotes !== -1 ? String(row[pNotes] ?? "").trim() || null : null,
      };
      const flag = flagFromProjectSignals(signals);
      if (!flag) continue; // no rule fired — project not flagged
      project_flags.push({
        project_code: code,
        project_name: pName !== -1 ? String(row[pName] ?? "").trim() : code,
        team_name: pTeam !== -1 ? String(row[pTeam] ?? "").trim() : "",
        flag_type: flag.flag_type,
        wip_value: signals.wip_value,
        wip_age_days: signals.wip_age_days,
        overrun_pct: signals.overrun_pct,
        rag_status: flag.rag_status,
        notes: signals.notes ?? flag.reason,
      });
    }
  }

  return {
    period_label,
    ebit_actual,
    ebit_budget,
    gross_profit_pct,
    teams,
    project_flags,
  };
}
