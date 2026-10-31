"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { BlockInfo, PatternResult } from "@/lib/generator";
import { defaultState, parseState } from "@/lib/state";
import { BlockBuilder } from "./BlockBuilder";

function FromShareLink({ block, initial }: { block: BlockInfo; initial: PatternResult }) {
  const params = useSearchParams();
  return <BlockBuilder block={block} initialState={parseState(block, params)} initialResult={initial} />;
}

/**
 * Static pages have no query string at build time, so the exported HTML holds
 * the default design (real cuts and steps, for readers and search engines) and
 * the browser then picks up any settings from a share link.
 */
export function BlockBuilderRoute({ block, initial }: { block: BlockInfo; initial: PatternResult }) {
  return (
    <Suspense fallback={<BlockBuilder block={block} initialState={defaultState(block)} initialResult={initial} />}>
      <FromShareLink block={block} initial={initial} />
    </Suspense>
  );
}
