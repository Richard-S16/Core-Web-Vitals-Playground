"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CoreMetric, MetricRating } from "@/types/metrics";
import { METRIC_THRESHOLDS } from "@/types/metrics";

interface MetricBenchmarkProps {
  metrics: CoreMetric[];
}

const RATING_COLORS: Record<MetricRating, string> = {
  good: "#22c55e",
  "needs-improvement": "#f97316",
  poor: "#ef4444",
};

function normalizeValue(metric: CoreMetric): number {
  const threshold = METRIC_THRESHOLDS[metric.id];
  if (!threshold) return 50;
  // Normalize to percentage of "poor" threshold so bars are comparable
  return Math.min((metric.value / threshold.poor) * 100, 200);
}

export function MetricBenchmark({ metrics }: MetricBenchmarkProps) {
  const data = metrics.map((m) => ({
    name: m.abbreviation,
    value: normalizeValue(m),
    raw: m.displayValue,
    rating: m.rating,
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Metric Benchmark
      </h4>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Values normalized against &quot;poor&quot; threshold (100% = poor
        boundary)
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-lg">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-zinc-400">{d.raw}</p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={100}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: "Poor",
              position: "right",
              fill: "#ef4444",
              fontSize: 11,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={index} fill={RATING_COLORS[entry.rating]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
