"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, StitchInfo } from "@/lib/generator";
import { defaultStitchState, parseStitchState } from "@/lib/stitchState";
import { StitchBuilder } from "./StitchBuilder";

function FromShareLink({ stitch, locale }: { stitch: StitchInfo; locale: Locale }) {
  const params = useSearchParams();
  return <StitchBuilder stitch={stitch} locale={locale} initialState={parseStitchState(stitch, params, locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`. */
export function StitchBuilderRoute({ stitch, locale }: { stitch: StitchInfo; locale: Locale }) {
  return (
    <Suspense fallback={<StitchBuilder stitch={stitch} locale={locale} initialState={defaultStitchState(stitch, locale)} />}>
      <FromShareLink stitch={stitch} locale={locale} />
    </Suspense>
  );
}
