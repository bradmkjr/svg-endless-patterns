"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseNatureState } from "@/lib/natureState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { NatureBuilder } from "./NatureBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <NatureBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseNatureState(withOption("nature", option, params), locale), ...storedSeed("nature", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function NatureBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<NatureBuilder locale={locale} option={option} labels={labels} initialState={parseNatureState(withOption("nature", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
