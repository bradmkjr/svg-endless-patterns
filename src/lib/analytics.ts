"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useEffect, useRef } from "react";
import type { ToolId } from "./toolOptions";

export type AnalyticsTool = ToolId | "block" | "stitch" | "tartan";

/** Long enough that dragging a color picker or tapping through a list counts once. */
const SETTLE_MS = 1000;

/** The names of the top-level settings that differ, never their values. */
export function changedSettings(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).sort();
}

export function trackCustomize(tool: AnalyticsTool, settings: string[]) {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent("event", "customize_pattern", { tool, settings: settings.join(",") });
}

/**
 * Reports a builder's settings each time they change and settle. The settings a page
 * opens with don't count, and neither does a change undone before it settles.
 */
export function useTrackCustomize(tool: AnalyticsTool, state: object) {
  const key = JSON.stringify(state);
  const reported = useRef(key);

  useEffect(() => {
    if (key === reported.current) return;
    const timer = setTimeout(() => {
      const settings = changedSettings(JSON.parse(reported.current), JSON.parse(key));
      reported.current = key;
      trackCustomize(tool, settings);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [key, tool]);
}
