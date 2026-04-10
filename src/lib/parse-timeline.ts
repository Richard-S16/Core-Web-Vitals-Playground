import type { PSIResponse } from "@/types/pagespeed";

export interface TimelineCategory {
  group: string;
  label: string;
  duration: number;
  color: string;
}

export interface TimelineData {
  categories: TimelineCategory[];
  totalDuration: number;
}

const GROUP_CONFIG: Record<string, { label: string; color: string }> = {
  scriptEvaluation: { label: "Scripting", color: "#f59e0b" },
  styleLayout: { label: "Rendering", color: "#8b5cf6" },
  paintCompositeRender: { label: "Painting", color: "#22c55e" },
  scriptParseCompile: { label: "Script Parsing", color: "#ef4444" },
  parseHTML: { label: "Parse HTML", color: "#3b82f6" },
  garbageCollection: { label: "Garbage Collection", color: "#ec4899" },
  other: { label: "Other", color: "#6b7280" },
};

interface MainThreadItem {
  group?: string;
  groupLabel?: string;
  duration?: number;
}

interface MainThreadAudit {
  details?: {
    items?: MainThreadItem[];
  };
}

export function parseTimelineData(raw: PSIResponse): TimelineData | null {
  const audit = raw.lighthouseResult.audits[
    "mainthread-work-breakdown"
  ] as unknown as MainThreadAudit | undefined;

  if (!audit?.details?.items?.length) return null;

  let totalDuration = 0;
  const categories: TimelineCategory[] = [];

  for (const item of audit.details.items) {
    const group = item.group ?? "other";
    const duration = item.duration ?? 0;
    if (duration <= 0) continue;

    totalDuration += duration;
    const config = GROUP_CONFIG[group] ?? GROUP_CONFIG.other;
    categories.push({
      group,
      label: config.label,
      duration: Math.round(duration),
      color: config.color,
    });
  }

  categories.sort((a, b) => b.duration - a.duration);

  return { categories, totalDuration: Math.round(totalDuration) };
}
