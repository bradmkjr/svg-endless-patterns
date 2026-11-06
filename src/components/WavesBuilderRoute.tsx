"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseWavesState } from "@/lib/wavesState";
import { withOption } from "@/lib/toolOptions";
import { WavesBuilder } from "./WavesBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <WavesBuilder locale={locale} option={option} labels={labels} initialState={parseWavesState(withOption("waves", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function WavesBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<WavesBuilder locale={locale} option={option} labels={labels} initialState={parseWavesState(withOption("waves", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
