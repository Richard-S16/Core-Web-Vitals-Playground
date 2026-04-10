/// <reference lib="webworker" />

import { parseResponse } from "../lib/parse-report";
import { generateSuggestions } from "../lib/suggestions-engine";
import { parseBundleData } from "../lib/parse-bundle";
import { parseTimelineData } from "../lib/parse-timeline";
import type { PSIResponse } from "../types/pagespeed";

interface WorkerInput {
  raw: PSIResponse;
  url: string;
  strategy: "mobile" | "desktop";
}

const workerSelf = self as unknown as DedicatedWorkerGlobalScope;

workerSelf.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { raw, url, strategy } = e.data;

  const result = parseResponse(raw, url, strategy);
  const suggestions = generateSuggestions(result.metrics, raw);
  const bundleData = parseBundleData(raw);
  const timelineData = parseTimelineData(raw);

  workerSelf.postMessage({ result, suggestions, bundleData, timelineData });
};
