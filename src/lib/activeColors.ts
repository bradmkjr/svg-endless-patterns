"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Every color square on the page reports its color here, so any one of them can
 * suggest colors that go with the whole pattern without a builder passing them down.
 */
const colors = new Map<string, string>();
const listeners = new Set<() => void>();
const EMPTY: string[] = [];
let snapshot: string[] = EMPTY;

function publish() {
  snapshot = [...colors.values()];
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Report this square's color while it's on the page. */
export function useReportColor(id: string, color: string) {
  useEffect(() => {
    colors.set(id, color);
    publish();
  }, [id, color]);
  useEffect(
    () => () => {
      colors.delete(id);
      publish();
    },
    [id],
  );
}

/** The colors on the page right now. */
export function useActiveColors(): string[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY);
}
