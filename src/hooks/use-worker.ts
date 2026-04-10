import { useRef, useCallback, useEffect } from "react";

export function useWorker<TInput, TOutput>(
  createWorker: () => Worker
): { process: (data: TInput) => Promise<TOutput> } {
  const workerRef = useRef<Worker | null>(null);

  const process = useCallback(
    (data: TInput): Promise<TOutput> => {
      return new Promise((resolve, reject) => {
        workerRef.current?.terminate();

        try {
          const worker = createWorker();
          workerRef.current = worker;

          worker.onmessage = (e: MessageEvent<TOutput>) => {
            resolve(e.data);
            worker.terminate();
            workerRef.current = null;
          };

          worker.onerror = (err) => {
            reject(new Error(err.message || "Worker error"));
            worker.terminate();
            workerRef.current = null;
          };

          worker.postMessage(data);
        } catch (err) {
          reject(
            err instanceof Error ? err : new Error("Failed to create worker")
          );
        }
      });
    },
    [createWorker]
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { process };
}
