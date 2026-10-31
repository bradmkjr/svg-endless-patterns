"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CrossStitchResult, Locale } from "@/lib/generator";
import { defaultCrossStitchState, parseCrossStitchState } from "@/lib/crossStitchState";
import { CrossStitchBuilder } from "./CrossStitchBuilder";

function FromShareLink({ initial, locale }: { initial: CrossStitchResult; locale: Locale }) {
  const params = useSearchParams();
  return <CrossStitchBuilder locale={locale} initialState={parseCrossStitchState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function CrossStitchBuilderRoute({ initial, locale }: { initial: CrossStitchResult; locale: Locale }) {
  return (
    <Suspense fallback={<CrossStitchBuilder locale={locale} initialState={defaultCrossStitchState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
