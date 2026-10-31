"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import copy from "@/i18n/messages/knitColorwork.json";
import type { Locale } from "@/lib/generator";
import { parseKnitColorworkState } from "@/lib/knitColorworkState";
import { withOption } from "@/lib/toolOptions";
import { KnitColorworkBuilder } from "./KnitColorworkBuilder";

type Props = { locale: Locale; option?: string; labels: Record<string, string> };

function FromShareLink({ locale, option, labels }: Props) {
  const params = useSearchParams();
  return <KnitColorworkBuilder locale={locale} option={option} labels={labels} initialState={parseKnitColorworkState(withOption("knitColorwork", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first square in the browser. */
export function KnitColorworkBuilderRoute({ locale, option, labels }: Props) {
  return (
    <Suspense key={option} fallback={<p role="status">{copy[locale].loading}</p>}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
