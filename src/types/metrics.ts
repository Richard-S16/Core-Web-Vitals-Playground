export type MetricRating = "good" | "needs-improvement" | "poor";

export interface CoreMetric {
  id: string;
  name: string;
  abbreviation: string;
  value: number;
  displayValue: string;
  rating: MetricRating;
  description: string;
}

export interface AuditResult {
  url: string;
  strategy: "mobile" | "desktop";
  fetchTime: string;
  performanceScore: number;
  metrics: CoreMetric[];
  fieldData: FieldMetric[] | null;
}

export interface FieldMetric {
  id: string;
  name: string;
  abbreviation: string;
  percentile: number;
  category: "FAST" | "AVERAGE" | "SLOW";
  distributions: {
    min: number;
    max: number;
    proportion: number;
    label: string;
  }[];
}

// CWV thresholds per https://web.dev/vitals/
export const METRIC_THRESHOLDS: Record<
  string,
  { good: number; poor: number; unit: string }
> = {
  "largest-contentful-paint": { good: 2500, poor: 4000, unit: "ms" },
  "cumulative-layout-shift": { good: 0.1, poor: 0.25, unit: "" },
  "interaction-to-next-paint": { good: 200, poor: 500, unit: "ms" },
  "first-contentful-paint": { good: 1800, poor: 3000, unit: "ms" },
  "total-blocking-time": { good: 200, poor: 600, unit: "ms" },
  "speed-index": { good: 3400, poor: 5800, unit: "ms" },
};

export function getRating(metricId: string, value: number): MetricRating {
  const threshold = METRIC_THRESHOLDS[metricId];
  if (!threshold) return "needs-improvement";
  if (value <= threshold.good) return "good";
  if (value >= threshold.poor) return "poor";
  return "needs-improvement";
}

export function formatMetricValue(metricId: string, value: number): string {
  if (metricId === "cumulative-layout-shift") {
    return value.toFixed(2);
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} s`;
  }
  return `${Math.round(value)} ms`;
}
