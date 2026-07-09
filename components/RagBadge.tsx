import type { RagStatus } from "@/lib/types";

/**
 * Status chip — icon + label, never color alone (dataviz status rule).
 * Status palette is fixed: good #0ca30c · warning #fab219 · critical #d03b3b.
 */
const STYLES: Record<
  RagStatus,
  { bg: string; text: string; dot: string; label: string; icon: string }
> = {
  green: {
    bg: "bg-green-50",
    text: "text-green-800",
    dot: "bg-[#0ca30c]",
    label: "Green",
    icon: "✓",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-[#fab219]",
    label: "Amber",
    icon: "!",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-800",
    dot: "bg-[#d03b3b]",
    label: "Red",
    icon: "✕",
  },
};

export function RagBadge({
  status,
  size = "md",
}: {
  status: RagStatus;
  size?: "sm" | "md";
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${s.bg} ${s.text} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full text-white ${s.dot} ${
          size === "sm" ? "h-3.5 w-3.5 text-[9px]" : "h-4 w-4 text-[10px]"
        }`}
        aria-hidden
      >
        {s.icon}
      </span>
      {s.label}
    </span>
  );
}
