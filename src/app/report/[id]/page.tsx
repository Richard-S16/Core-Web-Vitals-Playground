"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { decodeReport, type ShareableReport } from "@/lib/report-codec";
import { ResultsPanel } from "@/components/results-panel";

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<ShareableReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function decode() {
      try {
        const id = params.id;
        if (!id) throw new Error("No report data found");

        const decoded = await decodeReport(id);
        setReport(decoded);
      } catch {
        setError("Invalid or corrupted report link.");
      } finally {
        setLoading(false);
      }
    }
    decode();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading report…
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Invalid Report
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {error || "Report data not found."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Playground
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            ⚡ CWV Playground
          </Link>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
            Shared Report
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-12">
        <ResultsPanel
          result={report.result}
          rawResponse={null}
          suggestions={report.suggestions}
          onReset={() => (window.location.href = "/")}
        />
      </main>
    </div>
  );
}
