"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CelticKnotResult, Locale } from "@/lib/generator";
import { defaultCelticKnotState, parseCelticKnotState } from "@/lib/celticKnotState";
import { CelticKnotBuilder } from "./CelticKnotBuilder";

function FromShareLink({ initial, locale }: { initial: CelticKnotResult; locale: Locale }) {
  const params = useSearchParams();
  return <CelticKnotBuilder locale={locale} initialState={parseCelticKnotState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function CelticKnotBuilderRoute({ initial, locale }: { initial: CelticKnotResult; locale: Locale }) {
  return (
    <Suspense fallback={<CelticKnotBuilder locale={locale} initialState={defaultCelticKnotState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
