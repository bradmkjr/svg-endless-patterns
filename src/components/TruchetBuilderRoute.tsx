"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TruchetResult } from "@/lib/generator";
import { parseTruchetState } from "@/lib/truchetState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { TruchetBuilder } from "./TruchetBuilder";

function FromShareLink({ initial, locale, option, labels }: { initial: TruchetResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <TruchetBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseTruchetState(withOption("truchet", option, params), locale), ...storedSeed("truchet", params) }} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TruchetBuilderRoute({ initial, locale, option, labels }: { initial: TruchetResult; locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<TruchetBuilder locale={locale} option={option} labels={labels} initialState={parseTruchetState(withOption("truchet", option), locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
