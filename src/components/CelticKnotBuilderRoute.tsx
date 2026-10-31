"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { CelticKnotResult, Locale } from "@/lib/generator";
import { parseCelticKnotState } from "@/lib/celticKnotState";
import { withOption } from "@/lib/toolOptions";
import { CelticKnotBuilder } from "./CelticKnotBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: CelticKnotResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <CelticKnotBuilder locale={locale} option={option} labels={labels} initialState={parseCelticKnotState(withOption("celticKnot", option, params), locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function CelticKnotBuilderRoute({ initial, locale, option, labels }: { initial: CelticKnotResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<CelticKnotBuilder locale={locale} option={option} labels={labels} initialState={parseCelticKnotState(withOption("celticKnot", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
