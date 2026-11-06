"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseWeavingState } from "@/lib/weavingState";
import { withOption } from "@/lib/toolOptions";
import { WeavingBuilder } from "./WeavingBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <WeavingBuilder locale={locale} option={option} labels={labels} initialState={parseWeavingState(withOption("weaving", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function WeavingBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<WeavingBuilder locale={locale} option={option} labels={labels} initialState={parseWeavingState(withOption("weaving", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
