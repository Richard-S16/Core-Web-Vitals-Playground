import type { PSIResponse } from "@/types/pagespeed";
import type { AuditResult, FieldMetric } from "@/types/metrics";
import { getRating, formatMetricValue } from "@/types/metrics";

export const METRIC_MAP = [
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

function parseFieldData(raw: PSIResponse): FieldMetric[] | null {
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

export function parseResponse(
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
