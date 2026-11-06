"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseRdState } from "@/lib/reactionDiffusionState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { ReactionDiffusionBuilder } from "./ReactionDiffusionBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <ReactionDiffusionBuilder locale={locale} option={option} labels={labels} initialState={{ ...parseRdState(withOption("reactionDiffusion", option, params), locale), ...storedSeed("reactionDiffusion", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function ReactionDiffusionBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<ReactionDiffusionBuilder locale={locale} option={option} labels={labels} initialState={parseRdState(withOption("reactionDiffusion", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
