"use client";

import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  const previousValue = useRef<T | undefined>(undefined);
  const currentValue = ref.current;

  useEffect(() => {
    previousValue.current = currentValue;
  });

  return previousValue.current;
}
