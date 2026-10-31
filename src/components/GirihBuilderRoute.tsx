"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { GirihResult, Locale } from "@/lib/generator";
import { defaultGirihState, parseGirihState } from "@/lib/girihState";
import { GirihBuilder } from "./GirihBuilder";

function FromShareLink({ initial, locale }: { initial: GirihResult; locale: Locale }) {
  const params = useSearchParams();
  return <GirihBuilder locale={locale} initialState={parseGirihState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function GirihBuilderRoute({ initial, locale }: { initial: GirihResult; locale: Locale }) {
  return (
    <Suspense fallback={<GirihBuilder locale={locale} initialState={defaultGirihState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
