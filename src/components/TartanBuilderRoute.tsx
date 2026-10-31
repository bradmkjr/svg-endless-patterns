"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { defaultTartanState, parseTartanState } from "@/lib/tartanState";
import { TartanBuilder } from "./TartanBuilder";

function FromShareLink({ locale }: { locale: Locale }) {
  const params = useSearchParams();
  return <TartanBuilder locale={locale} initialState={parseTartanState(params, locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TartanBuilderRoute({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<TartanBuilder locale={locale} initialState={defaultTartanState(locale)} />}>
      <FromShareLink locale={locale} />
    </Suspense>
  );
}
