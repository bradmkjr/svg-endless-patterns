"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TessellationOptions, TessellationResult } from "@/lib/generator";
import { defaultTessellationState, parseTessellationState } from "@/lib/tessellationState";
import { TessellationBuilder } from "./TessellationBuilder";

type Props = { initial: TessellationResult; options: TessellationOptions; locale: Locale };

function FromShareLink({ initial, options, locale }: Props) {
  const params = useSearchParams();
  return <TessellationBuilder locale={locale} options={options} initialState={parseTessellationState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TessellationBuilderRoute({ initial, options, locale }: Props) {
  return (
    <Suspense fallback={<TessellationBuilder locale={locale} options={options} initialState={defaultTessellationState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} options={options} locale={locale} />
    </Suspense>
  );
}
