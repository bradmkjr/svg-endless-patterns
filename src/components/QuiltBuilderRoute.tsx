"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { parseQuiltState } from "@/lib/quiltState";
import { storedSeed, withOption } from "@/lib/toolOptions";
import { QuiltBuilder } from "./QuiltBuilder";

type Props = { locale: Locale; option?: string; labels: Record<string, string>; blockNames: Record<string, string> };

function FromShareLink(props: Props) {
  const params = useSearchParams();
  return <QuiltBuilder {...props} initialState={{ ...parseQuiltState(withOption("quilt", props.option, params), props.locale), ...storedSeed("quilt", params) }} />;
}

/** Same arrangement as `BlockBuilderRoute`: the design's default in the HTML, a share link's settings on load. */
export function QuiltBuilderRoute(props: Props) {
  return (
    <Suspense key={props.option} fallback={<QuiltBuilder {...props} initialState={parseQuiltState(withOption("quilt", props.option), props.locale)} />}>
      <FromShareLink {...props} />
    </Suspense>
  );
}
