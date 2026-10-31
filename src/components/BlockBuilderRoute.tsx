"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { BlockInfo, Locale, PatternResult } from "@/lib/generator";
import { defaultState, parseState } from "@/lib/state";
import { BlockBuilder } from "./BlockBuilder";

function FromShareLink({ block, initial, locale }: { block: BlockInfo; initial: PatternResult; locale: Locale }) {
  const params = useSearchParams();
  return <BlockBuilder block={block} locale={locale} initialState={parseState(block, params, locale)} initialResult={initial} />;
}

/**
 * Static pages have no query string at build time, so the exported HTML holds
 * the default design (real cuts and steps, for readers and search engines) and
 * the browser then picks up any settings from a share link.
 */
export function BlockBuilderRoute({ block, initial, locale }: { block: BlockInfo; initial: PatternResult; locale: Locale }) {
  return (
    <Suspense fallback={<BlockBuilder block={block} locale={locale} initialState={defaultState(block, locale)} initialResult={initial} />}>
      <FromShareLink block={block} initial={initial} locale={locale} />
    </Suspense>
  );
}
