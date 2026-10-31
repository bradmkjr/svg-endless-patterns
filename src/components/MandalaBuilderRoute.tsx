"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseMandalaState } from "@/lib/mandalaState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { MandalaBuilder } from "./MandalaBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <MandalaBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseMandalaState(withOption("mandala", option, params), locale), ...storedSeed("mandala", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function MandalaBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<MandalaBuilder locale={locale} option={option} labels={labels} initialState={parseMandalaState(withOption("mandala", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
