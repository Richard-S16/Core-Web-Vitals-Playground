"use client";

import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { BundleData } from "@/lib/parse-bundle";

interface BundleTreemapProps {
  data: BundleData;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

const FIRST_PARTY_COLOR = "#3b82f6";
const THIRD_PARTY_COLOR = "#f97316";

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  color?: string;
}

function CustomContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  color,
}: TreemapContentProps) {
  if (width < 40 || height < 24) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color ?? "#3b82f6"}
          stroke="#18181b"
          strokeWidth={2}
          rx={4}
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color ?? "#3b82f6"}
        stroke="#18181b"
        strokeWidth={2}
        rx={4}
      />
      <text
        x={x + 6}
        y={y + 16}
        fill="#fafafa"
        fontSize={11}
        fontWeight={600}
      >
        {name && name.length > Math.floor(width / 7)
          ? name.slice(0, Math.floor(width / 7)) + "…"
          : name}
      </text>
    </g>
  );
}

export function BundleTreemap({ data }: BundleTreemapProps) {
  const treemapData = [
    ...data.firstParty.map((n) => ({
      name: n.name,
      size: n.size,
      color: FIRST_PARTY_COLOR,
    })),
    ...data.thirdParty.map((n) => ({
      name: n.name,
      size: n.size,
      color: THIRD_PARTY_COLOR,
    })),
  ].filter((n) => n.size > 0);

  if (treemapData.length === 0) return null;

  const firstPct =
    data.totalBytes > 0
      ? Math.round((data.firstPartyBytes / data.totalBytes) * 100)
      : 0;
  const thirdPct = 100 - firstPct;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        JS Bundle Breakdown
      </h4>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Total: {formatBytes(data.totalBytes)} · 1st party:{" "}
        {formatBytes(data.firstPartyBytes)} ({firstPct}%) · 3rd party:{" "}
        {formatBytes(data.thirdPartyBytes)} ({thirdPct}%)
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <Treemap
          data={treemapData}
          dataKey="size"
          nameKey="name"
          stroke="#18181b"
          content={<CustomContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const isThirdParty = d.color === THIRD_PARTY_COLOR;
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
                  <p className="font-medium text-zinc-100">{d.name}</p>
                  <p className="text-zinc-400">{formatBytes(d.size)}</p>
                  <p
                    className="text-xs"
                    style={{ color: isThirdParty ? THIRD_PARTY_COLOR : FIRST_PARTY_COLOR }}
                  >
                    {isThirdParty ? "Third-party" : "First-party"}
                  </p>
                </div>
              );
            }}
          />
        </Treemap>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: FIRST_PARTY_COLOR }}
          />
          First-party
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: THIRD_PARTY_COLOR }}
          />
          Third-party
        </div>
      </div>
    </div>
  );
}
