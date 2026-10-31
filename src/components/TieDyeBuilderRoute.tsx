"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseTieDyeState } from "@/lib/tieDyeState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { TieDyeBuilder } from "./TieDyeBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <TieDyeBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseTieDyeState(withOption("tieDye", option, params), locale), ...storedSeed("tieDye", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TieDyeBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<TieDyeBuilder locale={locale} option={option} labels={labels} initialState={parseTieDyeState(withOption("tieDye", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
