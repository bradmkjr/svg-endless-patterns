"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseCheckerboardState } from "@/lib/checkerboardState";
import { withOption } from "@/lib/toolOptions";
import { CheckerboardBuilder } from "./CheckerboardBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <CheckerboardBuilder locale={locale} option={option} labels={labels} initialState={parseCheckerboardState(withOption("checkerboard", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first preview in the browser. */
export function CheckerboardBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<CheckerboardBuilder locale={locale} option={option} labels={labels} initialState={parseCheckerboardState(withOption("checkerboard", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
