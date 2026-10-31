"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseSashikoState } from "@/lib/sashikoState";
import { withOption } from "@/lib/toolOptions";
import { SashikoBuilder } from "./SashikoBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <SashikoBuilder locale={locale} option={option} labels={labels} initialState={parseSashikoState(withOption("sashiko", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function SashikoBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<SashikoBuilder locale={locale} option={option} labels={labels} initialState={parseSashikoState(withOption("sashiko", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
