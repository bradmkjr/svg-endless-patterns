"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TieDyeResult } from "@/lib/generator";
import { parseTieDyeState } from "@/lib/tieDyeState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { TieDyeBuilder } from "./TieDyeBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: TieDyeResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <TieDyeBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseTieDyeState(withOption("tieDye", option, params), locale), ...storedSeed("tieDye", params) }} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TieDyeBuilderRoute({ initial, locale, option, labels }: { initial: TieDyeResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<TieDyeBuilder locale={locale} option={option} labels={labels} initialState={parseTieDyeState(withOption("tieDye", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
