"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseLifeState } from "@/lib/lifeState";
import { withOption } from "@/lib/toolOptions";
import { LifeBuilder } from "./LifeBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <LifeBuilder locale={locale} option={option} labels={labels} initialState={parseLifeState(withOption("life", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first design in the browser. */
export function LifeBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<LifeBuilder locale={locale} option={option} labels={labels} initialState={parseLifeState(withOption("life", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
