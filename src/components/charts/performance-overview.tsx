"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CoreMetric } from "@/types/metrics";
import { METRIC_THRESHOLDS } from "@/types/metrics";

interface PerformanceOverviewProps {
  metrics: CoreMetric[];
  performanceScore: number;
}

function metricToScore(metric: CoreMetric): number {
  const threshold = METRIC_THRESHOLDS[metric.id];
  if (!threshold) return 50;

  // Convert to 0-100 score where 100 = best
  if (metric.value <= threshold.good) return 100;
  if (metric.value >= threshold.poor) {
    // Scale from 0-30 for values beyond poor
    return Math.max(0, 30 - ((metric.value - threshold.poor) / threshold.poor) * 30);
  }
  // Linear interpolation between good (100) and poor (30)
  const ratio =
    (metric.value - threshold.good) / (threshold.poor - threshold.good);
  return Math.round(100 - ratio * 70);
}

export function PerformanceOverview({
  metrics,
  performanceScore,
}: PerformanceOverviewProps) {
  const data = metrics.map((m) => ({
    metric: m.abbreviation,
    score: metricToScore(m),
    fullMark: 100,
  }));

  const scoreColor =
    performanceScore >= 90
      ? "#22c55e"
      : performanceScore >= 50
        ? "#f97316"
        : "#ef4444";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Performance Overview
        </h4>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: scoreColor }}
          />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Score: {performanceScore}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#71717a" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={scoreColor}
            fill={scoreColor}
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
            }}
            formatter={(value) => [`${value}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
