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
import type { FieldMetric } from "@/types/metrics";

interface MetricDistributionProps {
  fieldData: FieldMetric[];
}

const COLORS = {
  Good: "#22c55e",
  "Needs Improvement": "#f97316",
  Poor: "#ef4444",
};

interface DistributionDatum {
  metric: string;
  Good: number;
  "Needs Improvement": number;
  Poor: number;
}

export function MetricDistribution({ fieldData }: MetricDistributionProps) {
  const data: DistributionDatum[] = fieldData.map((field) => {
    const row: DistributionDatum = {
      metric: field.abbreviation,
      Good: 0,
      "Needs Improvement": 0,
      Poor: 0,
    };
    field.distributions.forEach((d) => {
      const key = d.label as keyof typeof COLORS;
      if (key in row) {
        row[key] = Math.round(d.proportion * 100);
      }
    });
    return row;
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Field Data Distribution
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" barCategoryGap="20%">
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
          />
          <YAxis
            type="category"
            dataKey="metric"
            width={50}
            tick={{ fontSize: 12, fill: "#a1a1aa" }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`]}
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fafafa",
            }}
          />
          {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={COLORS[key]}
              radius={key === "Poor" ? [0, 4, 4, 0] : undefined}
            >
              {data.map((_, index) => (
                <Cell key={index} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        {Object.entries(COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
