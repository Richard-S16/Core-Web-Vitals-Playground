import type { MetricRating } from "@/types/metrics";

interface MetricCardProps {
  name: string;
  abbreviation: string;
  displayValue: string;
  rating: MetricRating;
  description: string;
}

const RATING_STYLES: Record<
  MetricRating,
  { bg: string; text: string; border: string; dot: string }
> = {
  good: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
  "needs-improvement": {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  poor: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
};

const RATING_LABELS: Record<MetricRating, string> = {
  good: "Good",
  "needs-improvement": "Needs Improvement",
  poor: "Poor",
};

export function MetricCard({
  name,
  abbreviation,
  displayValue,
  rating,
  description,
}: MetricCardProps) {
  const styles = RATING_STYLES[rating];

  return (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {abbreviation}
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {name}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${styles.text}`}>{displayValue}</p>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${styles.dot}`} />
            <span className={`text-xs font-medium ${styles.text}`}>
              {RATING_LABELS[rating]}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
