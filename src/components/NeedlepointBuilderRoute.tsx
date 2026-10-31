"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseNeedlepointState } from "@/lib/needlepointState";
import { withOption } from "@/lib/toolOptions";
import { NeedlepointBuilder } from "./NeedlepointBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <NeedlepointBuilder locale={locale} option={option} labels={labels} initialState={parseNeedlepointState(withOption("needlepoint", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function NeedlepointBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<NeedlepointBuilder locale={locale} option={option} labels={labels} initialState={parseNeedlepointState(withOption("needlepoint", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
