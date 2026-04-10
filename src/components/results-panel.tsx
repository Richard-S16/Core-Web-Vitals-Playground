import type { AuditResult, MetricRating } from "@/types/metrics";
import { MetricCard } from "./metric-card";

interface ResultsPanelProps {
  result: AuditResult;
  onReset: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreRing(score: number): string {
  if (score >= 90)
    return "ring-green-500/30 border-green-500 dark:border-green-400";
  if (score >= 50)
    return "ring-orange-500/30 border-orange-500 dark:border-orange-400";
  return "ring-red-500/30 border-red-500 dark:border-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function getOverallRating(score: number): MetricRating {
  if (score >= 90) return "good";
  if (score >= 50) return "needs-improvement";
  return "poor";
}

export function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  const scoreColor = getScoreColor(result.performanceScore);
  const scoreRing = getScoreRing(result.performanceScore);
  const _ = getOverallRating(result.performanceScore);

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Results for{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {result.url}
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {result.strategy === "mobile" ? "📱 Mobile" : "🖥️ Desktop"} ·
            Analyzed {new Date(result.fetchTime).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← New Analysis
        </button>
      </div>

      {/* Performance Score */}
      <div className="flex items-center gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div
          className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 ring-4 ${scoreRing}`}
        >
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {result.performanceScore}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Performance Score
          </h3>
          <p className={`text-sm font-medium ${scoreColor}`}>
            {getScoreLabel(result.performanceScore)}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Values are estimated and may vary. The performance score is
            calculated from lab data metrics.
          </p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Core Web Vitals
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.metrics
            .filter((m) =>
              [
                "largest-contentful-paint",
                "cumulative-layout-shift",
                "interaction-to-next-paint",
              ].includes(m.id)
            )
            .map((metric) => (
              <MetricCard key={metric.id} {...metric} />
            ))}
        </div>
      </div>

      {/* Other Metrics */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Other Metrics
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.metrics
            .filter(
              (m) =>
                ![
                  "largest-contentful-paint",
                  "cumulative-layout-shift",
                  "interaction-to-next-paint",
                ].includes(m.id)
            )
            .map((metric) => (
              <MetricCard key={metric.id} {...metric} />
            ))}
        </div>
      </div>

      {/* Field Data */}
      {result.fieldData && result.fieldData.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Real-World Field Data (CrUX)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.fieldData.map((field) => (
              <div
                key={field.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {field.abbreviation}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {field.name}
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  75th percentile:{" "}
                  <span className="font-medium">{field.percentile}</span>
                </p>
                {/* Distribution bar */}
                <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
                  {field.distributions.map((d, i) => {
                    const colors = [
                      "bg-green-500",
                      "bg-orange-500",
                      "bg-red-500",
                    ];
                    return (
                      <div
                        key={i}
                        className={`${colors[i]} h-full`}
                        style={{ width: `${d.proportion * 100}%` }}
                        title={`${d.label}: ${(d.proportion * 100).toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-500">
                  {field.distributions.map((d, i) => (
                    <span key={i}>{(d.proportion * 100).toFixed(0)}%</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
