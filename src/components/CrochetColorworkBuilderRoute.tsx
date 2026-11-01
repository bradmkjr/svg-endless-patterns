"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseCrochetColorworkState } from "@/lib/crochetColorworkState";
import { withOption } from "@/lib/toolOptions";
import { ToolLoading } from "./ToolLoading";
import { CrochetColorworkBuilder } from "./CrochetColorworkBuilder";

type Props = { locale: Locale; option?: string; labels: Record<string, string> };

function FromShareLink({ locale, option, labels }: Props) {
  const params = useSearchParams();
  return <CrochetColorworkBuilder locale={locale} option={option} labels={labels} initialState={parseCrochetColorworkState(withOption("crochetColorwork", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first square in the browser. */
export function CrochetColorworkBuilderRoute({ locale, option, labels }: Props) {
  return (
    <Suspense key={option} fallback={<ToolLoading locale={locale} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
