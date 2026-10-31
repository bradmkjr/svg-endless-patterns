"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TruchetResult } from "@/lib/generator";
import { defaultTruchetState, parseTruchetState } from "@/lib/truchetState";
import { TruchetBuilder } from "./TruchetBuilder";

function FromShareLink({ initial, locale }: { initial: TruchetResult; locale: Locale }) {
  const params = useSearchParams();
  return <TruchetBuilder locale={locale} initialState={parseTruchetState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TruchetBuilderRoute({ initial, locale }: { initial: TruchetResult; locale: Locale }) {
  return (
    <Suspense fallback={<TruchetBuilder locale={locale} initialState={defaultTruchetState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
