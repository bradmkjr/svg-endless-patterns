"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, NeedlepointResult } from "@/lib/generator";
import { parseNeedlepointState } from "@/lib/needlepointState";
import { withOption } from "@/lib/toolOptions";
import { NeedlepointBuilder } from "./NeedlepointBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: NeedlepointResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <NeedlepointBuilder locale={locale} option={option} labels={labels} initialState={parseNeedlepointState(withOption("needlepoint", option, params), locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function NeedlepointBuilderRoute({ initial, locale, option, labels }: { initial: NeedlepointResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<NeedlepointBuilder locale={locale} option={option} labels={labels} initialState={parseNeedlepointState(withOption("needlepoint", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
