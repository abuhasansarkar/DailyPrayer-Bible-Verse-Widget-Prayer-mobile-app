import { useCallback, useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useAsyncData
//
// Loads async data for a key, without ever calling setState synchronously
// inside an effect body.
//
// Why that matters: the app builds with React Compiler enabled
// (app.json → experiments.reactCompiler), and a synchronous setState in an
// effect causes a cascading re-render the compiler's memoisation assumes away.
// The two rules this hook follows:
//
//   1. The effect only schedules work; every state update happens in the
//      promise continuation, after the first await.
//   2. Resetting to the loading state when `key` changes is done during
//      render via the officially supported "adjust state on prop change"
//      pattern, not in an effect.
// ─────────────────────────────────────────────────────────────────────────────

export interface AsyncData<T> {
  data: T;
  loading: boolean;
  error: string | null;
  /** Re-run the fetcher for the current key. */
  refresh: () => Promise<void>;
  /** Replace data locally without refetching (e.g. after an optimistic write). */
  setData: (updater: T | ((current: T) => T)) => void;
}

export function useAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  initialData: T
): AsyncData<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjust state during render when the key changes, so consumers never see
  // the previous key's data paired with loading === false.
  const [renderedKey, setRenderedKey] = useState(key);
  if (key !== renderedKey) {
    setRenderedKey(key);
    setData(initialData);
    setLoading(true);
    setError(null);
  }

  // `fetcher` must be memoised by the caller (useCallback); it is a real
  // dependency here rather than being hidden behind a ref.
  const run = useCallback((isCancelled: () => boolean) => {
    return fetcher()
      .then((result) => {
        if (isCancelled()) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (isCancelled()) return;
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      })
      .finally(() => {
        if (isCancelled()) return;
        setLoading(false);
      });
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;
    // No state is written here — only inside run()'s continuations.
    void run(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [run]);

  const refresh = useCallback(async () => {
    await run(() => false);
  }, [run]);

  return { data, loading, error, refresh, setData };
}
