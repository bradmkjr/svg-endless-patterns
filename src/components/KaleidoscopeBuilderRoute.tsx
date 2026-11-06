"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseKaleidoscopeState } from "@/lib/kaleidoscopeState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { KaleidoscopeBuilder } from "./KaleidoscopeBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <KaleidoscopeBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseKaleidoscopeState(withOption("kaleidoscope", option, params), locale), ...storedSeed("kaleidoscope", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function KaleidoscopeBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<KaleidoscopeBuilder locale={locale} option={option} labels={labels} initialState={parseKaleidoscopeState(withOption("kaleidoscope", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
