"use client";

import { useEffect, useCallback } from "react";

type KeyHandler = (event: KeyboardEvent) => void;

interface UseKeyPressOptions {
  target?: EventTarget;
  eventType?: "keydown" | "keyup" | "keypress";
}

export function useKeyPress(
  key: string | string[],
  handler: KeyHandler,
  options: UseKeyPressOptions = {}
): void {
  const { target, eventType = "keydown" } = options;

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.includes(event.key)) {
        handler(event);
      }
    },
    [key, handler]
  );

  useEffect(() => {
    const element = target || document;
    element.addEventListener(eventType, handleKeyPress as EventListener);
    return () =>
      element.removeEventListener(eventType, handleKeyPress as EventListener);
  }, [target, eventType, handleKeyPress]);
}

export function useKeyPress组合(
  combinations: Record<string, KeyHandler>,
  options: UseKeyPressOptions = {}
): void {
  const { target, eventType = "keydown" } = options;

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const parts = Object.keys(combinations);
      for (const combo of parts) {
        const keys = combo.split("+").map((k) => k.trim());
        const modifiers = keys.slice(0, -1).map((k) => k.toLowerCase());
        const mainKey = keys[keys.length - 1];

        const ctrl = modifiers.includes("ctrl") || modifiers.includes("mod");
        const shift = modifiers.includes("shift");
        const alt = modifiers.includes("alt");
        const meta = modifiers.includes("meta") || modifiers.includes("cmd");

        if (
          event.key.toLowerCase() === mainKey.toLowerCase() &&
          event.ctrlKey === ctrl &&
          event.shiftKey === shift &&
          event.altKey === alt &&
          event.metaKey === meta
        ) {
          event.preventDefault();
          combinations[combo](event);
        }
      }
    },
    [combinations]
  );

  useEffect(() => {
    const element = target || document;
    element.addEventListener(eventType, handleKeyPress as EventListener);
    return () =>
      element.removeEventListener(eventType, handleKeyPress as EventListener);
  }, [target, eventType, handleKeyPress]);
}

export function useEscapeKey(handler: KeyHandler): void {
  useKeyPress("Escape", handler);
}

export function useEnterKey(handler: KeyHandler): void {
  useKeyPress("Enter", handler);
}

export function useArrowKeys(
  onUp: KeyHandler,
  onDown: KeyHandler,
  onLeft?: KeyHandler,
  onRight?: KeyHandler
): void {
  useKeyPress("ArrowUp", onUp);
  useKeyPress("ArrowDown", onDown);
  if (onLeft) useKeyPress("ArrowLeft", onLeft);
  if (onRight) useKeyPress("ArrowRight", onRight);
}
