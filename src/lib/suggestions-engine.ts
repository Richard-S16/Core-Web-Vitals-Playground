import type { PSIResponse } from "@/types/pagespeed";
import type { CoreMetric, MetricRating } from "@/types/metrics";

export type SuggestionSeverity = "high" | "medium" | "low";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  metric: string;
  learnMoreUrl?: string;
}

interface SuggestionRule {
  metricId: string;
  metricAbbreviation: string;
  condition: (metric: CoreMetric) => boolean;
  severity: (metric: CoreMetric) => SuggestionSeverity;
  title: string;
  description: (metric: CoreMetric) => string;
  learnMoreUrl?: string;
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    metricId: "largest-contentful-paint",
    metricAbbreviation: "LCP",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "medium"),
    title: "Optimize Largest Contentful Paint",
    description: (m) =>
      `LCP is ${m.displayValue} (threshold: ≤2.5s). Consider: preload the hero image with <link rel="preload">, use next/image with priority, serve images in WebP/AVIF format, and ensure the server responds quickly (optimize TTFB).`,
    learnMoreUrl: "https://web.dev/articles/optimize-lcp",
  },
  {
    metricId: "cumulative-layout-shift",
    metricAbbreviation: "CLS",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "medium"),
    title: "Reduce Layout Shifts",
    description: (m) =>
      `CLS is ${m.displayValue} (threshold: ≤0.1). Set explicit width/height or aspect-ratio on images and videos, avoid inserting content above existing content, and use CSS containment for dynamic elements.`,
    learnMoreUrl: "https://web.dev/articles/optimize-cls",
  },
  {
    metricId: "interaction-to-next-paint",
    metricAbbreviation: "INP",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "medium"),
    title: "Improve Interaction Responsiveness",
    description: (m) =>
      `INP is ${m.displayValue} (threshold: ≤200ms). Break up long tasks using scheduler.yield() or setTimeout, move heavy computation to Web Workers, and minimize input delay by reducing main-thread work.`,
    learnMoreUrl: "https://web.dev/articles/optimize-inp",
  },
  {
    metricId: "first-contentful-paint",
    metricAbbreviation: "FCP",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "medium"),
    title: "Speed Up First Contentful Paint",
    description: (m) =>
      `FCP is ${m.displayValue} (threshold: ≤1.8s). Eliminate render-blocking resources, inline critical CSS, defer non-critical JavaScript, and use a CDN to reduce server response time.`,
    learnMoreUrl: "https://web.dev/articles/fcp",
  },
  {
    metricId: "total-blocking-time",
    metricAbbreviation: "TBT",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "medium"),
    title: "Reduce Total Blocking Time",
    description: (m) =>
      `TBT is ${m.displayValue} (threshold: ≤200ms). Split long JavaScript tasks into smaller chunks, defer third-party scripts, use code splitting with dynamic import(), and move heavy logic to Web Workers.`,
    learnMoreUrl: "https://web.dev/articles/tbt",
  },
  {
    metricId: "speed-index",
    metricAbbreviation: "SI",
    condition: (m) => m.rating !== "good",
    severity: (m) => (m.rating === "poor" ? "high" : "low"),
    title: "Improve Speed Index",
    description: (m) =>
      `Speed Index is ${m.displayValue} (threshold: ≤3.4s). Minimize main-thread work, optimize font loading with font-display: swap, reduce the critical request depth, and load visible content first.`,
    learnMoreUrl: "https://web.dev/articles/speed-index",
  },
];

interface PSIOpportunity {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  displayValue?: string;
  details?: {
    overallSavingsMs?: number;
  };
}

const PSI_AUDIT_SUGGESTIONS: Record<
  string,
  { title: string; severity: SuggestionSeverity; metric: string }
> = {
  "render-blocking-resources": {
    title: "Eliminate render-blocking resources",
    severity: "high",
    metric: "FCP",
  },
  "unused-javascript": {
    title: "Remove unused JavaScript",
    severity: "medium",
    metric: "TBT",
  },
  "unused-css-rules": {
    title: "Remove unused CSS",
    severity: "low",
    metric: "FCP",
  },
  "unminified-javascript": {
    title: "Minify JavaScript",
    severity: "medium",
    metric: "TBT",
  },
  "unminified-css": {
    title: "Minify CSS",
    severity: "low",
    metric: "FCP",
  },
  "uses-responsive-images": {
    title: "Properly size images",
    severity: "medium",
    metric: "LCP",
  },
  "offscreen-images": {
    title: "Defer offscreen images",
    severity: "low",
    metric: "LCP",
  },
  "uses-optimized-images": {
    title: "Efficiently encode images",
    severity: "medium",
    metric: "LCP",
  },
  "uses-text-compression": {
    title: "Enable text compression",
    severity: "high",
    metric: "FCP",
  },
  "uses-rel-preconnect": {
    title: "Preconnect to required origins",
    severity: "medium",
    metric: "FCP",
  },
  "server-response-time": {
    title: "Reduce server response time (TTFB)",
    severity: "high",
    metric: "LCP",
  },
  "dom-size": {
    title: "Reduce DOM size",
    severity: "medium",
    metric: "INP",
  },
  "legacy-javascript": {
    title: "Avoid serving legacy JavaScript to modern browsers",
    severity: "low",
    metric: "TBT",
  },
};

export function generateSuggestions(
  metrics: CoreMetric[],
  raw: PSIResponse | null
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Rule-based suggestions from metric values
  for (const rule of SUGGESTION_RULES) {
    const metric = metrics.find((m) => m.id === rule.metricId);
    if (metric && rule.condition(metric)) {
      suggestions.push({
        id: `rule-${rule.metricId}`,
        title: rule.title,
        description: rule.description(metric),
        severity: rule.severity(metric),
        metric: rule.metricAbbreviation,
        learnMoreUrl: rule.learnMoreUrl,
      });
    }
  }

  // PSI audit-based suggestions (opportunities with savings)
  if (raw?.lighthouseResult?.audits) {
    const audits = raw.lighthouseResult.audits;
    for (const [auditId, config] of Object.entries(PSI_AUDIT_SUGGESTIONS)) {
      const audit = audits[auditId] as unknown as PSIOpportunity | undefined;
      if (!audit) continue;

      // Only include audits that failed (score < 1) or have savings
      const hasIssue =
        (audit.score !== null && audit.score !== undefined && audit.score < 0.9) ||
        (audit.details?.overallSavingsMs && audit.details.overallSavingsMs > 0);

      if (hasIssue) {
        const description = [
          audit.description ?? "",
          audit.displayValue ? `Potential savings: ${audit.displayValue}` : "",
        ]
          .filter(Boolean)
          .join(" — ");

        suggestions.push({
          id: `psi-${auditId}`,
          title: config.title,
          description,
          severity: config.severity,
          metric: config.metric,
        });
      }
    }
  }

  // Sort by severity: high → medium → low
  const severityOrder: Record<SuggestionSeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return suggestions;
}
