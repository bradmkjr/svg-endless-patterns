"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale, MandalaResult } from "@/lib/generator";
import { defaultMandalaState, parseMandalaState } from "@/lib/mandalaState";
import { MandalaBuilder } from "./MandalaBuilder";

function FromShareLink({ initial, locale }: { initial: MandalaResult; locale: Locale }) {
  const params = useSearchParams();
  return <MandalaBuilder locale={locale} initialState={parseMandalaState(params, locale)} initialResult={initial} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function MandalaBuilderRoute({ initial, locale }: { initial: MandalaResult; locale: Locale }) {
  return (
    <Suspense fallback={<MandalaBuilder locale={locale} initialState={defaultMandalaState(locale)} initialResult={initial} />}>
      <FromShareLink initial={initial} locale={locale} />
    </Suspense>
  );
}
