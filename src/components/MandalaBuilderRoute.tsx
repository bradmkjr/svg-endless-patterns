"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseMandalaState } from "@/lib/mandalaState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { MandalaBuilder } from "./MandalaBuilder";

function FromShareLink({ locale, option, labels, fold }: { locale: Locale; option?: string; labels: Record<string, string>; fold?: number }) {
  const params = useSearchParams();
  const settings = withOption("mandala", option, params);
  if (fold) settings.set("n", String(fold));
  return <MandalaBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseMandalaState(settings, locale), ...storedSeed("mandala", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function MandalaBuilderRoute({ locale, option, labels, fold }: { locale: Locale; option?: string; labels: Record<string, string>; fold?: number }) {
  return (
    <Suspense key={option} fallback={<MandalaBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseMandalaState(withOption("mandala", option), locale), ...(fold ? { symmetry: fold } : {}) }} />}>
      <FromShareLink locale={locale} option={option} labels={labels} fold={fold} />
    </Suspense>
  );
}
