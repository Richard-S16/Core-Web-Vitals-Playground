export interface PSIRequest {
  url: string;
  strategy: "mobile" | "desktop";
}

export interface MetricDistribution {
  min: number;
  max: number;
  proportion: number;
}

export interface PSIMetric {
  percentile: number;
  distributions: MetricDistribution[];
  category: "FAST" | "AVERAGE" | "SLOW";
}

export interface LoadingExperience {
  id: string;
  metrics: {
    CUMULATIVE_LAYOUT_SHIFT_SCORE?: PSIMetric;
    EXPERIMENTAL_TIME_TO_FIRST_BYTE?: PSIMetric;
    FIRST_CONTENTFUL_PAINT_MS?: PSIMetric;
    FIRST_INPUT_DELAY_MS?: PSIMetric;
    INTERACTION_TO_NEXT_PAINT?: PSIMetric;
    LARGEST_CONTENTFUL_PAINT_MS?: PSIMetric;
  };
  overall_category: "FAST" | "AVERAGE" | "SLOW";
  initial_url: string;
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
}

export interface LighthouseCategory {
  id: string;
  title: string;
  score: number | null;
  auditRefs: { id: string; weight: number }[];
}

export interface LighthouseResult {
  requestedUrl: string;
  finalUrl: string;
  fetchTime: string;
  categories: {
    performance: LighthouseCategory;
  };
  audits: Record<string, LighthouseAudit>;
}

export interface PSIResponse {
  captchaResult: string;
  kind: string;
  id: string;
  loadingExperience: LoadingExperience;
  originLoadingExperience?: LoadingExperience;
  lighthouseResult: LighthouseResult;
  analysisUTCTimestamp: string;
}
