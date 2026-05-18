"use client";

import { useState } from "react";
import type { Suggestion, SuggestionSeverity } from "@/lib/suggestions-engine";

interface SuggestionsListProps {
  suggestions: Suggestion[];
}

const SEVERITY_STYLES: Record<
  SuggestionSeverity,
  { icon: string; bg: string; border: string; text: string; badge: string }
> = {
  high: {
    icon: "🔴",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  medium: {
    icon: "🟡",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-400",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  },
  low: {
    icon: "🟢",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
};

const SEVERITY_LABELS: Record<SuggestionSeverity, string> = {
  high: "High Impact",
  medium: "Medium Impact",
  low: "Low Impact",
};

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/20">
        <p className="text-lg font-semibold text-green-700 dark:text-green-400">
          🎉 No issues found!
        </p>
        <p className="mt-1 text-sm text-green-600 dark:text-green-500">
          All metrics are within acceptable thresholds.
        </p>
      </div>
    );
  }

  const highCount = suggestions.filter((s) => s.severity === "high").length;
  const mediumCount = suggestions.filter((s) => s.severity === "medium").length;
  const lowCount = suggestions.filter((s) => s.severity === "low").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
        </span>
        {highCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
            {highCount} high
          </span>
        )}
        {mediumCount > 0 && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
            {mediumCount} medium
          </span>
        )}
        {lowCount > 0 && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            {lowCount} low
          </span>
        )}
      </div>

      {/* Suggestion cards */}
      {suggestions.map((suggestion) => {
        const styles = SEVERITY_STYLES[suggestion.severity];
        const isExpanded = expandedId === suggestion.id;

        return (
          <div
            key={suggestion.id}
            className={`rounded-xl border transition-shadow hover:shadow-md ${styles.border} ${styles.bg}`}
          >
            <button
              onClick={() =>
                setExpandedId(isExpanded ? null : suggestion.id)
              }
              className="flex w-full items-start gap-3 p-4 text-left"
            >
              <span className="mt-0.5 text-base">{styles.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {suggestion.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
                  >
                    {SEVERITY_LABELS[suggestion.severity]}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {suggestion.metric}
                  </span>
                </div>
              </div>
              <span className="mt-0.5 text-zinc-400 transition-transform dark:text-zinc-500">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>
            {isExpanded && (
              <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-700/50">
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {suggestion.description}
                </p>
                {suggestion.learnMoreUrl && (
                  <a
                    href={suggestion.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Learn more →
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
