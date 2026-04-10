"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AuditResult } from "@/types/metrics";
import { METRIC_THRESHOLDS } from "@/types/metrics";

interface CompareBarProps {
  resultA: AuditResult;
  resultB: AuditResult;
}

function normalizeValue(metricId: string, value: number): number {
  const threshold = METRIC_THRESHOLDS[metricId];
  if (!threshold) return 50;
  return Math.min((value / threshold.poor) * 100, 200);
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function CompareBar({ resultA, resultB }: CompareBarProps) {
  const labelA = extractHostname(resultA.url);
  const labelB = extractHostname(resultB.url);

  const chartData = resultA.metrics.map((metricA) => {
    const metricB = resultB.metrics.find((m) => m.id === metricA.id);
    return {
      name: metricA.abbreviation,
      [labelA]: normalizeValue(metricA.id, metricA.value),
      [labelB]: metricB ? normalizeValue(metricB.id, metricB.value) : 0,
      rawA: metricA.displayValue,
      rawB: metricB?.displayValue ?? "N/A",
    };
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Side-by-Side Comparison
      </h3>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Normalized against &quot;poor&quot; thresholds — lower is better
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-lg">
                  <p className="font-medium">{d?.name}</p>
                  <p className="text-blue-400">
                    {labelA}: {d?.rawA}
                  </p>
                  <p className="text-orange-400">
                    {labelB}: {d?.rawB}
                  </p>
                </div>
              );
            }}
          />
          <Legend />
          <Bar
            dataKey={labelA}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey={labelB}
            fill="#f97316"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
