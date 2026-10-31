"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, SashikoResult } from "@/lib/generator";
import { parseSashikoState } from "@/lib/sashikoState";
import { withOption } from "@/lib/toolOptions";
import { SashikoBuilder } from "./SashikoBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: SashikoResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <SashikoBuilder locale={locale} option={option} labels={labels} initialState={parseSashikoState(withOption("sashiko", option, params), locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function SashikoBuilderRoute({ initial, locale, option, labels }: { initial: SashikoResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<SashikoBuilder locale={locale} option={option} labels={labels} initialState={parseSashikoState(withOption("sashiko", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
