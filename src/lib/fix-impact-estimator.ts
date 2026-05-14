import type { PSIResponse } from "@/types/pagespeed";


const BYTES_PER_MS = 1500;

interface AuditWithDetails {
  score?: number | null;
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  details?: {
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    items?: unknown[];
  };
}

export interface FixImpact {
  auditId: string;
  recommendation: string;
  metric: "LCP" | "CLS" | "INP" | "TBT" | "FCP";
  estimatedImpact: number;
  formattedImpact: string;
}

type ImpactRule = {
  auditId: string;
  recommendation: string;
  metric: FixImpact["metric"];
  calculate: (audit: AuditWithDetails) => number | null;
};

const IMPACT_RULES: ImpactRule[] = [
  {
    auditId: "render-blocking-resources",
    recommendation: "Eliminate render-blocking resources",
    metric: "LCP",
    calculate: (a) => {
      const ms =
        a.details?.overallSavingsMs ??
        (a.numericUnit === "millisecond" ? a.numericValue : null);
      return ms != null && ms > 50 ? ms : null;
    },
  },
  {
    auditId: "server-response-time",
    recommendation: "Reduce initial server response time (TTFB)",
    metric: "LCP",
    calculate: (a) => {
      if (
        a.numericUnit === "millisecond" &&
        a.numericValue != null &&
        a.numericValue > 600
      ) {
        return a.numericValue - 600;
      }
      return null;
    },
  },
  {
    auditId: "uses-optimized-images",
    recommendation: "Efficiently encode images",
    metric: "LCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 50 ? ms : null;
    },
  },
  {
    auditId: "uses-webp-images",
    recommendation: "Serve images in next-gen formats (WebP/AVIF)",
    metric: "LCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 50 ? ms : null;
    },
  },
  {
    auditId: "uses-responsive-images",
    recommendation: "Properly size images for each device",
    metric: "LCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 50 ? ms : null;
    },
  },
  {
    auditId: "offscreen-images",
    recommendation: "Defer offscreen / below-fold images",
    metric: "LCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 50 ? ms : null;
    },
  },
  {
    auditId: "uses-rel-preconnect",
    recommendation: "Preconnect to critical third-party origins",
    metric: "LCP",
    calculate: (a) => {
      const ms =
        a.details?.overallSavingsMs ??
        (a.numericUnit === "millisecond" ? a.numericValue : null);
      return ms != null && ms > 50 ? ms : null;
    },
  },

  {
    auditId: "unused-javascript",
    recommendation: "Reduce unused JavaScript",
    metric: "TBT",
    calculate: (a) => {
      const ms = a.details?.overallSavingsMs;
      if (ms != null && ms > 50) return ms;
      const bytes = a.numericUnit === "byte" ? a.numericValue : null;
      if (bytes == null) return null;
      const est = bytes / 1024;
      return est > 50 ? est : null;
    },
  },
  {
    auditId: "unminified-javascript",
    recommendation: "Minify JavaScript",
    metric: "TBT",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / 1024;
      return ms > 30 ? ms : null;
    },
  },
  {
    auditId: "legacy-javascript",
    recommendation: "Remove legacy JavaScript polyfills for modern browsers",
    metric: "TBT",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = (bytes / 1024) * 1.5;
      return ms > 50 ? ms : null;
    },
  },

  {
    auditId: "unused-css-rules",
    recommendation: "Remove unused CSS",
    metric: "FCP",
    calculate: (a) => {
      const ms = a.details?.overallSavingsMs;
      if (ms != null && ms > 30) return ms;
      const bytes = a.numericUnit === "byte" ? a.numericValue : null;
      if (bytes == null) return null;
      const est = bytes / BYTES_PER_MS;
      return est > 30 ? est : null;
    },
  },
  {
    auditId: "unminified-css",
    recommendation: "Minify CSS",
    metric: "FCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 30 ? ms : null;
    },
  },
  {
    auditId: "uses-text-compression",
    recommendation: "Enable text compression (gzip / brotli)",
    metric: "FCP",
    calculate: (a) => {
      const bytes =
        a.details?.overallSavingsBytes ??
        (a.numericUnit === "byte" ? a.numericValue : null);
      if (bytes == null) return null;
      const ms = bytes / BYTES_PER_MS;
      return ms > 50 ? ms : null;
    },
  },

  {
    auditId: "unsized-images",
    recommendation: "Add explicit width & height to all images",
    metric: "CLS",
    calculate: (a) => {
      const items = a.details?.items;
      if (items && items.length > 0) {
        return Math.min(items.length * 0.05, 0.25);
      }
      if (typeof a.score === "number" && a.score < 0.9) return 0.05;
      return null;
    },
  },
  {
    auditId: "layout-shift-elements",
    recommendation: "Stabilise elements that cause layout shifts",
    metric: "CLS",
    calculate: (a) => {
      const items = a.details?.items;
      if (items && items.length > 0) {
        return Math.min(items.length * 0.07, 0.25);
      }
      if (typeof a.score === "number" && a.score < 1) return 0.1;
      return null;
    },
  },
];

function formatImpact(metric: FixImpact["metric"], value: number): string {
  if (metric === "CLS") {
    return `−${value.toFixed(2)}`;
  }
  if (value >= 1000) {
    return `−${(value / 1000).toFixed(1)} s`;
  }
  return `−${Math.round(value)} ms`;
}

export function estimateFixImpacts(raw: PSIResponse | null): FixImpact[] {
  if (!raw?.lighthouseResult?.audits) return [];

  const audits = raw.lighthouseResult.audits;
  const impacts: FixImpact[] = [];

  for (const rule of IMPACT_RULES) {
    const audit = audits[rule.auditId] as AuditWithDetails | undefined;
    if (!audit) continue;

    const isIssue =
      audit.score === null ||
      audit.score === undefined ||
      (typeof audit.score === "number" && audit.score < 0.9);
    if (!isIssue) continue;

    const impact = rule.calculate(audit);
    if (impact == null || impact <= 0) continue;

    impacts.push({
      auditId: rule.auditId,
      recommendation: rule.recommendation,
      metric: rule.metric,
      estimatedImpact: impact,
      formattedImpact: formatImpact(rule.metric, impact),
    });
  }

  impacts.sort((a, b) => {
    const aVal =
      a.metric === "CLS" ? a.estimatedImpact * 1000 : a.estimatedImpact;
    const bVal =
      b.metric === "CLS" ? b.estimatedImpact * 1000 : b.estimatedImpact;
    return bVal - aVal;
  });

  return impacts;
}
