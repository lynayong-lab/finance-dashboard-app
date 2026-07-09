"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtMoney, fmtMoneyFull } from "@/lib/format";
import type { TrendPoint } from "@/lib/data";

/**
 * EBIT trend — single accent series (blue #2a78d6) for Actual, with Budget as
 * a dashed neutral reference line. One axis; recessive grid; crosshair tooltip.
 */
export function EbitTrendChart({ trend }: { trend: TrendPoint[] }) {
  const data = trend.map((t) => ({
    period: t.period_label,
    Actual: t.ebit_actual,
    Budget: t.ebit_budget,
  }));

  return (
    <div className="h-56 w-full" role="img" aria-label="EBIT actual vs budget trend">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 4 }}>
          <CartesianGrid stroke="#e1e0d9" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: "#898781", fontSize: 12 }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => fmtMoney(v)}
            tick={{ fill: "#898781", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: number | string) => fmtMoneyFull(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e1e0d9",
              fontSize: 13,
            }}
            cursor={{ stroke: "#c3c2b7", strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="Budget"
            stroke="#898781"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Actual"
            stroke="#2a78d6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#2a78d6", strokeWidth: 2, stroke: "#ffffff" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-[#2a78d6]" /> Actual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-0 w-4 border-t-2 border-dashed border-[#898781]"
            aria-hidden
          />{" "}
          Budget
        </span>
      </div>
    </div>
  );
}
