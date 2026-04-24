"use client";

import type { FixImpact } from "@/lib/fix-impact-estimator";

const METRIC_STYLES: Record<
  FixImpact["metric"],
  { bg: string; text: string; label: string }
> = {
  LCP: {
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    label: "LCP",
  },
  CLS: {
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    label: "CLS",
  },
  INP: {
    bg: "bg-green-100 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    label: "INP",
  },
  TBT: {
    bg: "bg-yellow-100 dark:bg-yellow-950/40",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "TBT",
  },
  FCP: {
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    label: "FCP",
  },
};

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-200 dark:ring-amber-800"
      : rank === 2
        ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 ring-zinc-200 dark:ring-zinc-700"
        : rank === 3
          ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 ring-orange-200 dark:ring-orange-800"
          : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500 ring-zinc-200 dark:ring-zinc-800";

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ${colors}`}
    >
      {rank}
    </span>
  );
}

interface FixImpactTableProps {
  impacts: FixImpact[];
}

export function FixImpactTable({ impacts }: FixImpactTableProps) {
  if (impacts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
          🎉 No significant issues found
        </p>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          The PageSpeed Insights audit did not surface any opportunities with
          measurable impact estimates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
        <span className="font-semibold">How are these estimates calculated?</span>{" "}
        Time savings are derived from PageSpeed Insights audit data/byte
        savings are converted to estimated transfer time at mobile network
        speeds. CLS reductions are approximated per shifted element. All values
        are directional estimates, not guarantees.
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400">
                #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400">
                Recommendation
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-500 dark:text-zinc-400">
                Metric
              </th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-500 dark:text-zinc-400">
                Estimated Impact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {impacts.map((item, i) => {
              const style = METRIC_STYLES[item.metric];
              return (
                <tr
                  key={item.auditId}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3.5">
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.recommendation}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                      {item.formattedImpact}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {impacts.map((item, i) => {
          const style = METRIC_STYLES[item.metric];
          return (
            <div
              key={item.auditId}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <RankBadge rank={i + 1} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {item.recommendation}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                  <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                    {item.formattedImpact}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["LCP", "TBT", "FCP", "CLS"] as const).map((metric) => {
          const metricImpacts = impacts.filter((i) => i.metric === metric);
          if (metricImpacts.length === 0) return null;

          const total = metricImpacts.reduce(
            (sum, i) => sum + i.estimatedImpact,
            0
          );
          const formatted =
            metric === "CLS"
              ? `−${total.toFixed(2)}`
              : total >= 1000
                ? `−${(total / 1000).toFixed(1)} s`
                : `−${Math.round(total)} ms`;

          const style = METRIC_STYLES[metric];
          return (
            <div
              key={metric}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
              >
                {metric}
              </span>
              <p className="mt-2 font-mono text-lg font-bold text-red-600 dark:text-red-400">
                {formatted}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                total potential savings
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
