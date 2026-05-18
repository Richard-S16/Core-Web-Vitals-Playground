"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TimelineData } from "@/lib/parse-timeline";

interface RenderTimelineProps {
  data: TimelineData;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

export function RenderTimeline({ data }: RenderTimelineProps) {
  const chartData = data.categories.map((cat) => ({
    name: cat.label,
    duration: cat.duration,
    color: cat.color,
    pct: ((cat.duration / data.totalDuration) * 100).toFixed(1),
  }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Main Thread Breakdown
      </h4>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Total: {formatDuration(data.totalDuration)} of main-thread work
      </p>

      {/* Stacked bar overview */}
      <div className="mb-6 flex h-8 w-full overflow-hidden rounded-lg">
        {data.categories.map((cat) => (
          <div
            key={cat.group}
            className="h-full transition-all"
            style={{
              width: `${(cat.duration / data.totalDuration) * 100}%`,
              backgroundColor: cat.color,
              minWidth: cat.duration / data.totalDuration > 0.02 ? "2px" : 0,
            }}
            title={`${cat.label}: ${formatDuration(cat.duration)}`}
          />
        ))}
      </div>

      {/* Detailed bar chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="15%">
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatDuration(v)}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof chartData)[number];
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
                  <p className="font-medium text-zinc-100">{d.name}</p>
                  <p className="text-zinc-400">
                    {formatDuration(d.duration)} ({d.pct}%)
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="duration" radius={[0, 4, 4, 0]} maxBarSize={32}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        {data.categories.slice(0, 6).map((cat) => (
          <div key={cat.group} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
          </div>
        ))}
      </div>
    </div>
  );
}
