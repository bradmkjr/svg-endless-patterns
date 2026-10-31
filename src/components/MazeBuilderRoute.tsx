"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, MazeResult } from "@/lib/generator";
import { parseMazeState } from "@/lib/mazeState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { MazeBuilder } from "./MazeBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: MazeResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <MazeBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseMazeState(withOption("maze", option, params), locale), ...storedSeed("maze", params) }} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function MazeBuilderRoute({ initial, locale, option, labels }: { initial: MazeResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<MazeBuilder locale={locale} option={option} labels={labels} initialState={parseMazeState(withOption("maze", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
