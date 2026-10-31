"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, NeedlepointResult } from "@/lib/generator";
import { defaultNeedlepointState, parseNeedlepointState } from "@/lib/needlepointState";
import { NeedlepointBuilder } from "./NeedlepointBuilder";

function FromShareLink({ initial, locale }: { initial: NeedlepointResult; locale: Locale }) {
  const params = useSearchParams();
  return <NeedlepointBuilder locale={locale} initialState={parseNeedlepointState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function NeedlepointBuilderRoute({ initial, locale }: { initial: NeedlepointResult; locale: Locale }) {
  return (
    <Suspense fallback={<NeedlepointBuilder locale={locale} initialState={defaultNeedlepointState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
