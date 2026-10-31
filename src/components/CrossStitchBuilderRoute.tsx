"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CrossStitchResult, Locale } from "@/lib/generator";
import { parseCrossStitchState } from "@/lib/crossStitchState";
import { withOption } from "@/lib/toolOptions";
import { CrossStitchBuilder } from "./CrossStitchBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: CrossStitchResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <CrossStitchBuilder locale={locale} option={option} labels={labels} initialState={parseCrossStitchState(withOption("crossStitch", option, params), locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function CrossStitchBuilderRoute({ initial, locale, option, labels }: { initial: CrossStitchResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<CrossStitchBuilder locale={locale} option={option} labels={labels} initialState={parseCrossStitchState(withOption("crossStitch", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
