"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, StainedGlassResult } from "@/lib/generator";
import { parseStainedGlassState } from "@/lib/stainedGlassState";
import { withOption } from "@/lib/toolOptions";
import { StainedGlassBuilder } from "./StainedGlassBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: StainedGlassResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <StainedGlassBuilder locale={locale} option={option} labels={labels} initialState={parseStainedGlassState(withOption("stainedGlass", option, params), locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function StainedGlassBuilderRoute({ initial, locale, option, labels }: { initial: StainedGlassResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<StainedGlassBuilder locale={locale} option={option} labels={labels} initialState={parseStainedGlassState(withOption("stainedGlass", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
