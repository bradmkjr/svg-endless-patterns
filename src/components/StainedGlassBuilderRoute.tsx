"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, StainedGlassResult } from "@/lib/generator";
import { defaultStainedGlassState, parseStainedGlassState } from "@/lib/stainedGlassState";
import { StainedGlassBuilder } from "./StainedGlassBuilder";

function FromShareLink({ initial, locale }: { initial: StainedGlassResult; locale: Locale }) {
  const params = useSearchParams();
  return <StainedGlassBuilder locale={locale} initialState={parseStainedGlassState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function StainedGlassBuilderRoute({ initial, locale }: { initial: StainedGlassResult; locale: Locale }) {
  return (
    <Suspense fallback={<StainedGlassBuilder locale={locale} initialState={defaultStainedGlassState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
