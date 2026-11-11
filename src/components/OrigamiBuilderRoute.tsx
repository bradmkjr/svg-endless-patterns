"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseOrigamiState } from "@/lib/origamiState";
import { withOption } from "@/lib/toolOptions";
import { OrigamiBuilder } from "./OrigamiBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <OrigamiBuilder locale={locale} option={option} labels={labels} initialState={parseOrigamiState(withOption("origami", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function OrigamiBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<OrigamiBuilder locale={locale} option={option} labels={labels} initialState={parseOrigamiState(withOption("origami", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
