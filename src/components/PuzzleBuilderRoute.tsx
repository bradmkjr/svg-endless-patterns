"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parsePuzzleState } from "@/lib/puzzleState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { PuzzleBuilder } from "./PuzzleBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <PuzzleBuilder locale={locale} option={option} labels={labels} initialState={{ ...parsePuzzleState(withOption("puzzle", option, params), locale), ...storedSeed("puzzle", params) }} />;
}

/** Share-link settings are read after hydration; the API draws the first sheet in the browser. */
export function PuzzleBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<PuzzleBuilder locale={locale} option={option} labels={labels} initialState={parsePuzzleState(withOption("puzzle", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
