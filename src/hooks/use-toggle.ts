"use client";

import { useState, useCallback } from "react";

export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void, () => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const set = useCallback((v: boolean) => setValue(v), []);

  return [value, toggle, setTrue, setFalse];
}
