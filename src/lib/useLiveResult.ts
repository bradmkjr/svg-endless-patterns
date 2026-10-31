"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** Long enough that dragging a color picker sends one request, not dozens. */
const SETTLE_MS = 200;

/**
 * What the API drew for the current settings, or null until the first answer. The first
 * request goes straight out; later ones wait for the settings to settle, since the API
 * is rate limited. The last good picture stays up while the next one is on its way.
 */
export function useLiveResult<Request, Result>(generate: (request: Request) => Promise<Result>, state: Request, setStatus: Dispatch<SetStateAction<string>>, errorText: string): Result | null {
  const [result, setResult] = useState<Result | null>(null);
  const key = JSON.stringify(state);
  const hasResult = result !== null;

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(
      () => {
        generate(JSON.parse(key) as Request).then(
          (next) => {
            if (stale) return;
            setResult(next);
            setStatus((status) => (status === errorText ? "" : status));
          },
          () => {
            if (!stale) setStatus(errorText);
          },
        );
      },
      hasResult ? SETTLE_MS : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // Only a change of settings asks again; the first answer arriving must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, generate, errorText, setStatus]);

  return result;
}
