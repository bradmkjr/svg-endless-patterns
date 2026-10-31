"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, SashikoResult } from "@/lib/generator";
import { defaultSashikoState, parseSashikoState } from "@/lib/sashikoState";
import { SashikoBuilder } from "./SashikoBuilder";

function FromShareLink({ initial, locale }: { initial: SashikoResult; locale: Locale }) {
  const params = useSearchParams();
  return <SashikoBuilder locale={locale} initialState={parseSashikoState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function SashikoBuilderRoute({ initial, locale }: { initial: SashikoResult; locale: Locale }) {
  return (
    <Suspense fallback={<SashikoBuilder locale={locale} initialState={defaultSashikoState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
