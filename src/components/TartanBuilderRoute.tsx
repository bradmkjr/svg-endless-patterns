"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TartanResult } from "@/lib/generator";
import { defaultTartanState, parseTartanState } from "@/lib/tartanState";
import { TartanBuilder } from "./TartanBuilder";

function FromShareLink({ initial, locale }: { initial: TartanResult; locale: Locale }) {
  const params = useSearchParams();
  return <TartanBuilder locale={locale} initialState={parseTartanState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TartanBuilderRoute({ initial, locale }: { initial: TartanResult; locale: Locale }) {
  return (
    <Suspense fallback={<TartanBuilder locale={locale} initialState={defaultTartanState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
