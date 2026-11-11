"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseOrigamiTessellationState } from "@/lib/origamiTessellationState";
import { withOption } from "@/lib/toolOptions";
import { OrigamiTessellationBuilder } from "./OrigamiTessellationBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <OrigamiTessellationBuilder locale={locale} option={option} labels={labels} initialState={parseOrigamiTessellationState(withOption("origamiTessellation", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function OrigamiTessellationBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<OrigamiTessellationBuilder locale={locale} option={option} labels={labels} initialState={parseOrigamiTessellationState(withOption("origamiTessellation", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
