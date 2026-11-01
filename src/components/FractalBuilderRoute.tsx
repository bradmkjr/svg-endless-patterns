"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseFractalState } from "@/lib/fractalState";
import { withOption } from "@/lib/toolOptions";
import { ToolLoading } from "./ToolLoading";
import { FractalBuilder } from "./FractalBuilder";

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  return <FractalBuilder locale={locale} option={option} labels={labels} initialState={parseFractalState(withOption("fractal", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first fractal in the browser. */
export function FractalBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<ToolLoading locale={locale} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
