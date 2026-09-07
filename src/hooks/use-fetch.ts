"use client";

import { useState, useCallback, useRef } from "react";

interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useFetch<T = unknown>(
  fetcher: (...args: unknown[]) => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { initialData, onSuccess, onError } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return {
    data,
    error,
    isLoading,
    isSuccess: data !== undefined && error === null,
    isError: error !== null,
    execute,
    reset,
  };
}

export function useFetchWithCache<T = unknown>(
  fetcher: (url: string) => Promise<T>,
  url: string
): UseFetchResult<T> {
  const cache = useRef<Map<string, T>>(new Map());

  const wrappedFetcher = useCallback(
    async (...args: unknown[]): Promise<T> => {
      const requestUrl = (args[0] as string) || url;
      const cached = cache.current.get(requestUrl);
      if (cached !== undefined) return cached;

      const result = await fetcher(requestUrl);
      cache.current.set(requestUrl, result);
      return result;
    },
    [fetcher, url]
  );

  const result = useFetch<T>(wrappedFetcher);

  const invalidateCache = useCallback(() => {
    cache.current.clear();
    result.reset();
  }, [result]);

  return { ...result, execute: result.execute };
}
