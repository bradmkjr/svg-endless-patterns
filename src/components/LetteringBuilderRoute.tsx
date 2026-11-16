"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseLetteringState } from "@/lib/letteringState";
import { withOption } from "@/lib/toolOptions";
import { LetteringBuilder } from "./LetteringBuilder";

type Props = { locale: Locale; option?: string; labels: Record<string, string> };

function FromShareLink({ locale, option, labels }: Props) {
  const params = useSearchParams();
  return <LetteringBuilder locale={locale} option={option} labels={labels} initialState={parseLetteringState(withOption("lettering", option, params), locale)} />;
}

/** Share-link settings are read after hydration; the API draws the first preview in the browser. */
export function LetteringBuilderRoute({ locale, option, labels }: Props) {
  return (
    <Suspense key={option} fallback={<LetteringBuilder locale={locale} option={option} labels={labels} initialState={parseLetteringState(withOption("lettering", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
