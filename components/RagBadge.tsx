import type { RagStatus } from "@/lib/types";

/**
 * Status pill — colored dot + colored text on a pale tint of the same color.
 * Not color alone: the text label ("Red"/"Amber"/"Green") carries the meaning.
 * Status palette is fixed: good #0ca30c · warning #fab219 · critical #d03b3b.
 */
const STYLES: Record<
  RagStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  green: {
    bg: "bg-green-50",
    text: "text-green-800",
    dot: "bg-[#0ca30c]",
    label: "Green",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-[#fab219]",
    label: "Amber",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-800",
    dot: "bg-[#d03b3b]",
    label: "Red",
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
        className={`inline-block rounded-full ${s.dot} ${
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
        }`}
        aria-hidden
      />
      {s.label}
    </span>
  );
}
