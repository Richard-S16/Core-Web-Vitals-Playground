"use client";

import { useState, type FormEvent } from "react";

interface UrlInputProps {
  onSubmit: (url: string, strategy: "mobile" | "desktop") => void;
  isLoading: boolean;
}

function isValidUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setValidationError("Please enter a URL");
      return;
    }

    // Prepend https:// if no protocol specified
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    if (!isValidUrl(withProtocol)) {
      setValidationError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setValidationError(null);
    onSubmit(withProtocol, strategy);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Enter a URL to analyze (e.g. example.com)"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
          disabled={isLoading}
          aria-label="Website URL"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing…
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {/* Strategy toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Strategy:
        </span>
        <div className="inline-flex rounded-md border border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setStrategy("mobile")}
            disabled={isLoading}
            className={`rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors ${
              strategy === "mobile"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            📱 Mobile
          </button>
          <button
            type="button"
            onClick={() => setStrategy("desktop")}
            disabled={isLoading}
            className={`rounded-r-md px-3 py-1.5 text-sm font-medium transition-colors ${
              strategy === "desktop"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            🖥️ Desktop
          </button>
        </div>
      </div>

      {validationError && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
