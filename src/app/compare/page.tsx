"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UrlInput } from "@/components/url-input";
import { MetricCard } from "@/components/metric-card";
import { CompareBar } from "@/components/charts/compare-bar";
import type { AuditResult } from "@/types/metrics";
import type { PSIResponse } from "@/types/pagespeed";
import { parseResponse } from "@/lib/parse-report";

interface AnalysisState {
  result: AuditResult | null;
  rawResponse: PSIResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  result: null,
  rawResponse: null,
  isLoading: false,
  error: null,
};

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

export default function ComparePage() {
  const [stateA, setStateA] = useState<AnalysisState>(initialState);
  const [stateB, setStateB] = useState<AnalysisState>(initialState);

  const createAnalyze = useCallback(
    (setter: React.Dispatch<React.SetStateAction<AnalysisState>>) =>
      async (url: string, strategy: "mobile" | "desktop") => {
        setter({
          result: null,
          rawResponse: null,
          isLoading: true,
          error: null,
        });

        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, strategy }),
          });

          const data = await response.json();

          if (!response.ok) {
            setter((prev) => ({
              ...prev,
              isLoading: false,
              error: data.error || `Analysis failed (${response.status})`,
            }));
            return;
          }

          const result = parseResponse(data, url, strategy);
          setter({
            result,
            rawResponse: data,
            isLoading: false,
            error: null,
          });
        } catch {
          setter((prev) => ({
            ...prev,
            isLoading: false,
            error: "Network error — could not reach the analysis server.",
          }));
        }
      },
    []
  );

  const bothReady = stateA.result && stateB.result;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            ⚡ CWV Playground
          </Link>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            Compare Mode
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* Input Section */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Site A
            </h2>
            <UrlInput
              onSubmit={createAnalyze(setStateA)}
              isLoading={stateA.isLoading}
            />
            {stateA.error && (
              <p className="text-sm text-red-500" role="alert">
                {stateA.error}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Site B
            </h2>
            <UrlInput
              onSubmit={createAnalyze(setStateB)}
              isLoading={stateB.isLoading}
            />
            {stateB.error && (
              <p className="text-sm text-red-500" role="alert">
                {stateB.error}
              </p>
            )}
          </div>
        </div>

        {/* Compare chart */}
        {bothReady && (
          <div className="mt-8">
            <CompareBar resultA={stateA.result!} resultB={stateB.result!} />
          </div>
        )}

        {/* Side-by-side scores + metrics */}
        {(stateA.result || stateB.result) && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {[stateA.result, stateB.result].map((result, idx) => {
              if (!result) return <div key={idx} />;
              const scoreColor = getScoreColor(result.performanceScore);
              const scoreRing = getScoreRing(result.performanceScore);
              return (
                <div key={idx} className="space-y-4">
                  {/* Score */}
                  <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 ring-4 ${scoreRing}`}
                    >
                      <span className={`text-xl font-bold ${scoreColor}`}>
                        {result.performanceScore}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {result.url}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {result.strategy === "mobile"
                          ? "📱 Mobile"
                          : "🖥️ Desktop"}
                      </p>
                    </div>
                  </div>

                  {/* Metric cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.metrics.map((metric) => (
                      <MetricCard key={metric.id} {...metric} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
