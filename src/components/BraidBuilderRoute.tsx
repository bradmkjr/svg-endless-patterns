"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseBraidState } from "@/lib/braidState";
import { withOption } from "@/lib/toolOptions";
import { BraidBuilder } from "./BraidBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <BraidBuilder locale={locale} option={option} labels={labels} initialState={parseBraidState(withOption("braid", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function BraidBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<BraidBuilder locale={locale} option={option} labels={labels} initialState={parseBraidState(withOption("braid", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
