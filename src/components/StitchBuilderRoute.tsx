"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { StitchInfo, StitchResult } from "@/lib/generator";
import { defaultStitchState, parseStitchState } from "@/lib/stitchState";
import { StitchBuilder } from "./StitchBuilder";

function FromShareLink({ stitch, initial }: { stitch: StitchInfo; initial: StitchResult }) {
  const params = useSearchParams();
  return <StitchBuilder stitch={stitch} initialState={parseStitchState(stitch, params)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function StitchBuilderRoute({ stitch, initial }: { stitch: StitchInfo; initial: StitchResult }) {
  return (
    <Suspense fallback={<StitchBuilder stitch={stitch} initialState={defaultStitchState(stitch)} initialResult={initial} />}>
      <FromShareLink stitch={stitch} initial={initial} />
    </Suspense>
  );
}
