"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseTruchetState } from "@/lib/truchetState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { TruchetBuilder } from "./TruchetBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <TruchetBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseTruchetState(withOption("truchet", option, params), locale), ...storedSeed("truchet", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TruchetBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<TruchetBuilder locale={locale} option={option} labels={labels} initialState={parseTruchetState(withOption("truchet", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
