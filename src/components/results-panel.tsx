"use client";

import { useState, useMemo, useCallback } from "react";
import type { AuditResult } from "@/types/metrics";
import type { PSIResponse } from "@/types/pagespeed";
import type { Suggestion } from "@/lib/suggestions-engine";
import type { BundleData } from "@/lib/parse-bundle";
import type { TimelineData } from "@/lib/parse-timeline";
import { MetricCard } from "./metric-card";
import { PerformanceOverview } from "./charts/performance-overview";
import { MetricBenchmark } from "./charts/metric-benchmark";
import { MetricDistribution } from "./charts/metric-distribution";
import { BundleTreemap } from "./charts/bundle-treemap";
import { RenderTimeline } from "./charts/render-timeline";
import { SuggestionsList } from "./suggestions-list";
import { FixImpactTable } from "./fix-impact-table";
import { generateSuggestions } from "@/lib/suggestions-engine";
import { estimateFixImpacts } from "@/lib/fix-impact-estimator";
import { parseBundleData } from "@/lib/parse-bundle";
import { parseTimelineData } from "@/lib/parse-timeline";
import { encodeReport } from "@/lib/report-codec";

interface ResultsPanelProps {
  result: AuditResult;
  rawResponse: PSIResponse | null;
  suggestions?: Suggestion[];
  bundleData?: BundleData | null;
  timelineData?: TimelineData | null;
  onReset: () => void;
}

type Tab = "overview" | "metrics" | "bundle" | "timeline" | "suggestions" | "fix-impact";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "metrics", label: "Metrics Detail", icon: "📈" },
  { id: "bundle", label: "Bundle Analysis", icon: "📦" },
  { id: "timeline", label: "Timeline", icon: "⏱️" },
  { id: "fix-impact", label: "Fix Impact", icon: "🎯" },
  { id: "suggestions", label: "Suggestions", icon: "💡" },
];

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

export function ResultsPanel({
  result,
  rawResponse,
  suggestions: suggestionsFromProps,
  bundleData: bundleDataFromProps,
  timelineData: timelineDataFromProps,
  onReset,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copying" | "copied" | "error"
  >("idle");

  const scoreColor = getScoreColor(result.performanceScore);
  const scoreRing = getScoreRing(result.performanceScore);

  const suggestions = useMemo(
    () =>
      suggestionsFromProps ?? generateSuggestions(result.metrics, rawResponse),
    [suggestionsFromProps, result.metrics, rawResponse]
  );

  const fixImpacts = useMemo(
    () => estimateFixImpacts(rawResponse),
    [rawResponse]
  );

  const bundleData = useMemo(
    () =>
      bundleDataFromProps !== undefined
        ? bundleDataFromProps
        : rawResponse
          ? parseBundleData(rawResponse)
          : null,
    [bundleDataFromProps, rawResponse]
  );

  const timelineData = useMemo(
    () =>
      timelineDataFromProps !== undefined
        ? timelineDataFromProps
        : rawResponse
          ? parseTimelineData(rawResponse)
          : null,
    [timelineDataFromProps, rawResponse]
  );

  const handleShare = useCallback(async () => {
    setShareStatus("copying");
    try {
      const encoded = await encodeReport({ result, suggestions });
      const shareUrl = `${window.location.origin}/report/${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  }, [result, suggestions]);

  return (
    <div className="w-full max-w-5xl space-y-6">
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            disabled={shareStatus === "copying"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {shareStatus === "copied"
              ? "✓ Copied!"
              : shareStatus === "error"
                ? "✗ Failed"
                : "🔗 Share"}
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← New Analysis
          </button>
        </div>
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
        {suggestions.length > 0 && (
          <div className="ml-auto hidden sm:block">
            <button
              onClick={() => setActiveTab("suggestions")}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              {suggestions.length} suggestion
              {suggestions.length !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === "suggestions" && suggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs leading-none text-white">
                {suggestions.length}
              </span>
            )}
            {tab.id === "fix-impact" && fixImpacts.length > 0 && (
              <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs leading-none text-white">
                {fixImpacts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* === OVERVIEW TAB === */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Radar chart + Benchmark side by side on desktop */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PerformanceOverview
                metrics={result.metrics}
                performanceScore={result.performanceScore}
              />
              <MetricBenchmark metrics={result.metrics} />
            </div>

            {/* Core Web Vitals cards */}
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

            {/* Other metrics */}
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
          </div>
        )}

        {/* === METRICS DETAIL TAB === */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            {/* All metric cards */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                All Lab Metrics
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.metrics.map((metric) => (
                  <MetricCard key={metric.id} {...metric} />
                ))}
              </div>
            </div>

            {/* Field data distribution chart */}
            {result.fieldData && result.fieldData.length > 0 && (
              <MetricDistribution fieldData={result.fieldData} />
            )}

            {/* Field data cards */}
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
                          <span key={i}>
                            {(d.proportion * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === BUNDLE ANALYSIS TAB === */}
        {activeTab === "bundle" && (
          <div className="space-y-6">
            {bundleData ? (
              <BundleTreemap data={bundleData} />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                  📦 No bundle data available
                </p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  The PageSpeed Insights API did not return script treemap data
                  for this page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* === TIMELINE TAB === */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            {timelineData ? (
              <RenderTimeline data={timelineData} />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                  ⏱️ No timeline data available
                </p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  The PageSpeed Insights API did not return main-thread
                  breakdown data for this page.
                </p>
              </div>
            )}
          </div>
        )}

        {/* === FIX IMPACT TAB === */}
        {activeTab === "fix-impact" && (
          <FixImpactTable impacts={fixImpacts} />
        )}

        {/* === SUGGESTIONS TAB === */}
        {activeTab === "suggestions" && (
          <SuggestionsList suggestions={suggestions} />
        )}
      </div>
    </div>
  );
}
