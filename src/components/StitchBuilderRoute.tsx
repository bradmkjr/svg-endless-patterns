"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, StitchInfo, StitchResult } from "@/lib/generator";
import { defaultStitchState, parseStitchState } from "@/lib/stitchState";
import { StitchBuilder } from "./StitchBuilder";

function FromShareLink({ stitch, initial, locale }: { stitch: StitchInfo; initial: StitchResult; locale: Locale }) {
  const params = useSearchParams();
  return <StitchBuilder stitch={stitch} locale={locale} initialState={parseStitchState(stitch, params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function StitchBuilderRoute({ stitch, initial, locale }: { stitch: StitchInfo; initial: StitchResult; locale: Locale }) {
  return (
    <Suspense fallback={<StitchBuilder stitch={stitch} locale={locale} initialState={defaultStitchState(stitch, locale)} initialResult={initial} />}>
      <FromShareLink stitch={stitch} initial={initial} locale={locale} />
    </Suspense>
  );
}
