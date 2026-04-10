"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { PSIResponse } from "@/types/pagespeed";
import type { AuditResult } from "@/types/metrics";
import { getRating, formatMetricValue } from "@/types/metrics";

interface ReportContextValue {
  result: AuditResult | null;
  rawResponse: PSIResponse | null;
  isLoading: boolean;
  error: string | null;
  analyze: (url: string, strategy: "mobile" | "desktop") => Promise<void>;
  reset: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

const METRIC_MAP: {
  auditId: string;
  name: string;
  abbreviation: string;
  description: string;
}[] = [
  {
    auditId: "largest-contentful-paint",
    name: "Largest Contentful Paint",
    abbreviation: "LCP",
    description:
      "Measures how long it takes for the largest content element to become visible. Aim for ≤2.5s.",
  },
  {
    auditId: "cumulative-layout-shift",
    name: "Cumulative Layout Shift",
    abbreviation: "CLS",
    description:
      "Measures visual stability — how much the page layout shifts during loading. Aim for ≤0.1.",
  },
  {
    auditId: "interaction-to-next-paint",
    name: "Interaction to Next Paint",
    abbreviation: "INP",
    description:
      "Measures responsiveness — how quickly the page responds to user interactions. Aim for ≤200ms.",
  },
  {
    auditId: "first-contentful-paint",
    name: "First Contentful Paint",
    abbreviation: "FCP",
    description:
      "Measures when the first piece of content is rendered on screen. Aim for ≤1.8s.",
  },
  {
    auditId: "total-blocking-time",
    name: "Total Blocking Time",
    abbreviation: "TBT",
    description:
      "Measures total time the main thread was blocked, preventing input responsiveness. Aim for ≤200ms.",
  },
  {
    auditId: "speed-index",
    name: "Speed Index",
    abbreviation: "SI",
    description:
      "Measures how quickly content is visually displayed during page load. Aim for ≤3.4s.",
  },
];

function parseResponse(
  raw: PSIResponse,
  url: string,
  strategy: "mobile" | "desktop"
): AuditResult {
  const audits = raw.lighthouseResult.audits;
  const perfScore =
    (raw.lighthouseResult.categories.performance?.score ?? 0) * 100;

  const metrics = METRIC_MAP.map((m) => {
    const audit = audits[m.auditId];
    const value = audit?.numericValue ?? 0;
    return {
      id: m.auditId,
      name: m.name,
      abbreviation: m.abbreviation,
      value,
      displayValue: audit?.displayValue ?? formatMetricValue(m.auditId, value),
      rating: getRating(m.auditId, value),
      description: m.description,
    };
  });

  const fieldMetrics = raw.loadingExperience?.metrics
    ? parseFieldData(raw)
    : null;

  return {
    url,
    strategy,
    fetchTime: raw.lighthouseResult.fetchTime,
    performanceScore: Math.round(perfScore),
    metrics,
    fieldData: fieldMetrics,
  };
}

const FIELD_METRIC_MAP: Record<
  string,
  { name: string; abbreviation: string }
> = {
  LARGEST_CONTENTFUL_PAINT_MS: {
    name: "Largest Contentful Paint",
    abbreviation: "LCP",
  },
  CUMULATIVE_LAYOUT_SHIFT_SCORE: {
    name: "Cumulative Layout Shift",
    abbreviation: "CLS",
  },
  INTERACTION_TO_NEXT_PAINT: {
    name: "Interaction to Next Paint",
    abbreviation: "INP",
  },
  FIRST_CONTENTFUL_PAINT_MS: {
    name: "First Contentful Paint",
    abbreviation: "FCP",
  },
  FIRST_INPUT_DELAY_MS: { name: "First Input Delay", abbreviation: "FID" },
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: {
    name: "Time to First Byte",
    abbreviation: "TTFB",
  },
};

function parseFieldData(raw: PSIResponse) {
  const fieldMetrics = raw.loadingExperience?.metrics;
  if (!fieldMetrics) return null;

  return Object.entries(fieldMetrics)
    .filter(([key]) => FIELD_METRIC_MAP[key])
    .map(([key, value]) => {
      const info = FIELD_METRIC_MAP[key];
      const labels = ["Good", "Needs Improvement", "Poor"];
      return {
        id: key,
        name: info.name,
        abbreviation: info.abbreviation,
        percentile: value.percentile,
        category: value.category,
        distributions: value.distributions.map(
          (d: { min: number; max: number; proportion: number }, i: number) => ({
            ...d,
            label: labels[i] ?? "Unknown",
          })
        ),
      };
    });
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [rawResponse, setRawResponse] = useState<PSIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (url: string, strategy: "mobile" | "desktop") => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setRawResponse(null);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, strategy }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || `Analysis failed (${response.status})`);
          return;
        }

        setRawResponse(data);
        setResult(parseResponse(data, url, strategy));
      } catch {
        setError("Network error — could not reach the analysis server.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setRawResponse(null);
    setError(null);
  }, []);

  return (
    <ReportContext.Provider
      value={{ result, rawResponse, isLoading, error, analyze, reset }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error("useReport must be used within a ReportProvider");
  }
  return ctx;
}
