"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
