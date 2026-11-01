"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { BlockInfo, Locale } from "@/lib/generator";
import { defaultState, parseState } from "@/lib/state";
import { BlockBuilder } from "./BlockBuilder";

function FromShareLink({ block, locale }: { block: BlockInfo; locale: Locale }) {
  const params = useSearchParams();
  return <BlockBuilder block={block} locale={locale} initialState={parseState(block, params, locale)} />;
}

/** Static pages have no query string at build time, so the browser picks up a share link's settings on load. */
export function BlockBuilderRoute({ block, locale }: { block: BlockInfo; locale: Locale }) {
  return (
    <Suspense fallback={<BlockBuilder block={block} locale={locale} initialState={defaultState(block, locale)} />}>
      <FromShareLink block={block} locale={locale} />
    </Suspense>
  );
}
