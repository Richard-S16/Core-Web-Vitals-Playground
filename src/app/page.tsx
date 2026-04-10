"use client";

import { useReport } from "@/context/report-context";
import { UrlInput } from "@/components/url-input";
import { ResultsPanel } from "@/components/results-panel";

export default function Home() {
  const { result, rawResponse, isLoading, error, analyze, reset } = useReport();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Header */}
      <header className="w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1
            className="cursor-pointer text-xl font-bold text-zinc-900 dark:text-zinc-100"
            onClick={reset}
          >
            ⚡ CWV Playground
          </h1>
          <a
            href="https://web.dev/vitals/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            What are Core Web Vitals?
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-12">
        {/* Show landing / input when no result */}
        {!result && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Understand{" "}
                <span className="text-blue-600 dark:text-blue-400">why</span>{" "}
                your website is slow
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
                Analyze any URL with Google PageSpeed Insights. Get detailed
                Core Web Vitals metrics, performance scores, and actionable
                insights.
              </p>
            </div>

            <UrlInput onSubmit={analyze} isLoading={isLoading} />

            {error && (
              <div
                className="w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Feature highlights */}
            <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "📊",
                  title: "Lab Metrics",
                  desc: "LCP, CLS, INP, FCP, TBT and Speed Index from Lighthouse.",
                },
                {
                  icon: "🌍",
                  title: "Field Data",
                  desc: "Real-world Chrome User Experience Report (CrUX) data.",
                },
                {
                  icon: "💡",
                  title: "Actionable Tips",
                  desc: "Understand what each metric means and how to improve it.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="text-2xl">{feature.icon}</div>
                  <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show results */}
        {result && <ResultsPanel result={result} rawResponse={rawResponse} onReset={reset} />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Powered by{" "}
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
          >
            PageSpeed Insights API
          </a>
        </div>
      </footer>
    </div>
  );
}
