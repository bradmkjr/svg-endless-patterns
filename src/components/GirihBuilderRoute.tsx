"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseGirihState } from "@/lib/girihState";
import { withOption } from "@/lib/toolOptions";
import { GirihBuilder } from "./GirihBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <GirihBuilder locale={locale} option={option} labels={labels} initialState={parseGirihState(withOption("girih", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function GirihBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<GirihBuilder locale={locale} option={option} labels={labels} initialState={parseGirihState(withOption("girih", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
