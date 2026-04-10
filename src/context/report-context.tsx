"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { PSIResponse } from "@/types/pagespeed";
import type { AuditResult } from "@/types/metrics";
import type { Suggestion } from "@/lib/suggestions-engine";
import type { BundleData } from "@/lib/parse-bundle";
import type { TimelineData } from "@/lib/parse-timeline";
import { parseResponse } from "@/lib/parse-report";
import { generateSuggestions } from "@/lib/suggestions-engine";
import { parseBundleData } from "@/lib/parse-bundle";
import { parseTimelineData } from "@/lib/parse-timeline";

interface ReportContextValue {
  result: AuditResult | null;
  rawResponse: PSIResponse | null;
  suggestions: Suggestion[];
  bundleData: BundleData | null;
  timelineData: TimelineData | null;
  isLoading: boolean;
  error: string | null;
  analyze: (url: string, strategy: "mobile" | "desktop") => Promise<void>;
  reset: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

interface WorkerOutput {
  result: AuditResult;
  suggestions: Suggestion[];
  bundleData: BundleData | null;
  timelineData: TimelineData | null;
}

function createParseWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  try {
    return new Worker(
      new URL("../workers/parse-report.worker.ts", import.meta.url)
    );
  } catch {
    return null;
  }
}

function parseOnMainThread(
  raw: PSIResponse,
  url: string,
  strategy: "mobile" | "desktop"
): WorkerOutput {
  const result = parseResponse(raw, url, strategy);
  const suggestions = generateSuggestions(result.metrics, raw);
  const bundleData = parseBundleData(raw);
  const timelineData = parseTimelineData(raw);
  return { result, suggestions, bundleData, timelineData };
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [rawResponse, setRawResponse] = useState<PSIResponse | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [bundleData, setBundleData] = useState<BundleData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const analyze = useCallback(
    async (url: string, strategy: "mobile" | "desktop") => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setRawResponse(null);
      setSuggestions([]);
      setBundleData(null);
      setTimelineData(null);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, strategy }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || `Analysis failed (${response.status})`);
          setIsLoading(false);
          return;
        }

        setRawResponse(data);

        // Try Web Worker first, fall back to main thread
        const worker = createParseWorker();
        if (worker) {
          workerRef.current = worker;
          worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
            const { result, suggestions, bundleData, timelineData } = e.data;
            setResult(result);
            setSuggestions(suggestions);
            setBundleData(bundleData);
            setTimelineData(timelineData);
            setIsLoading(false);
            worker.terminate();
            workerRef.current = null;
          };
          worker.onerror = () => {
            // Fallback to main thread on worker error
            const output = parseOnMainThread(data, url, strategy);
            setResult(output.result);
            setSuggestions(output.suggestions);
            setBundleData(output.bundleData);
            setTimelineData(output.timelineData);
            setIsLoading(false);
            worker.terminate();
            workerRef.current = null;
          };
          worker.postMessage({ raw: data, url, strategy });
        } else {
          const output = parseOnMainThread(data, url, strategy);
          setResult(output.result);
          setSuggestions(output.suggestions);
          setBundleData(output.bundleData);
          setTimelineData(output.timelineData);
          setIsLoading(false);
        }
      } catch {
        setError("Network error — could not reach the analysis server.");
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setRawResponse(null);
    setSuggestions([]);
    setBundleData(null);
    setTimelineData(null);
    setError(null);
  }, []);

  return (
    <ReportContext.Provider
      value={{
        result,
        rawResponse,
        suggestions,
        bundleData,
        timelineData,
        isLoading,
        error,
        analyze,
        reset,
      }}
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
