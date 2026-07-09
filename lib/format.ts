/** Compact SGD currency: 1185000 → "S$1.19M", 95000 → "S$95k". */
export function fmtMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}S$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}S$${Math.round(abs / 1_000)}k`;
  return `${sign}S$${abs.toFixed(0)}`;
}

export function fmtMoneyFull(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}S$${Math.abs(value).toLocaleString("en-SG", { maximumFractionDigits: 0 })}`;
}

export function fmtPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Signed percentage with explicit +/−. */
export function fmtSignedPct(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function variancePct(actual: number, budget: number): number {
  if (budget === 0) return 0;
  return ((actual - budget) / Math.abs(budget)) * 100;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
