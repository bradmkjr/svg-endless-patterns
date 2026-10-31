"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseMazeState } from "@/lib/mazeState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import copy from "@/i18n/messages/maze.json";
import { MazeBuilder } from "./MazeBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <MazeBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseMazeState(withOption("maze", option, params), locale), ...storedSeed("maze", params) }} />;
}

/** Share-link settings are read after hydration; the API builds the first maze in the browser. */
export function MazeBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<p role="status">{copy[locale].loading}</p>}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
