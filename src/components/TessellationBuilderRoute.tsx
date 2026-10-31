"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, TessellationOptions } from "@/lib/generator";
import { parseTessellationState } from "@/lib/tessellationState";
import { withOption } from "@/lib/toolOptions";
import { TessellationBuilder } from "./TessellationBuilder";

type Props = { options: TessellationOptions; locale: Locale; option?: string; labels: Record<string, string> };

function FromShareLink({ options, locale, option, labels }: Props) {
  const params = useSearchParams();
  return <TessellationBuilder locale={locale} options={options} option={option} labels={labels} initialState={parseTessellationState(withOption("tessellation", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function TessellationBuilderRoute({ options, locale, option, labels }: Props) {
  return (
    <Suspense key={option} fallback={<TessellationBuilder locale={locale} options={options} option={option} labels={labels} initialState={parseTessellationState(withOption("tessellation", option), locale)} />}>
      <FromShareLink options={options} locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
