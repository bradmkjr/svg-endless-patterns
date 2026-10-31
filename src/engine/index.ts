/**
 * Pattern generation: pure functions from a request to JSON, with no React,
 * Next or browser dependency, so it can run unchanged behind a backend API.
 * The site reaches it only through `lib/generator.ts`. The PDF lives in
 * `./pdf` so pages that never make one don't load pdf-lib.
 */
import { BLOCKS, type Block } from "./blocks";
import { blockCuts, describeCut, planQuilt, rulerFriendlySizes, type Cut } from "./cutting";
import { approxInches, inches } from "./format";
import { pieceSteps } from "./steps";
import { blockSvg, quiltSvg, tileSvg } from "./svg";
import type { BlockInfo, CutLine, PatternRequest, PatternResult } from "./types";

export type * from "./types";

function toInfo({ slug, name, family, level, grid, fabrics, summary }: Block): BlockInfo {
  return { slug, name, family, level, grid, fabrics, summary };
}

export function listBlocks(): BlockInfo[] {
  return BLOCKS.map(toInfo);
}

export function fabricLabel(block: Block, id: string): string {
  if (id === "sashing") return "Sashing";
  if (id === "border") return "Border";
  return block.fabrics.find((f) => f.id === id)?.label ?? id;
}

export function requireBlock(slug: string): Block {
  const block = BLOCKS.find((b) => b.slug === slug);
  if (!block) throw new Error(`Unknown block: ${slug}`);
  return block;
}

const toLine = (cut: Cut): CutLine => ({ fabric: cut.fabric, description: describeCut(cut), rounded: cut.rounded });

export function generatePattern(slug: string, request: PatternRequest): PatternResult {
  const block = requireBlock(slug);
  const plan = planQuilt(block, request);
  const perBlock = blockCuts(block, request.size);
  const hasRoundedCuts = perBlock.some((c) => c.rounded);
  const render = { seams: request.seams };
  return {
    svg: {
      block: blockSvg(block, request.size, request.colors, render),
      quilt: quiltSvg(block, request, render),
      tile: tileSvg(block, request, render),
    },
    blockCuts: perBlock.map(toLine),
    quiltCuts: plan.cuts.map(toLine),
    quilt: {
      ...plan.size,
      widthLabel: approxInches(plan.size.width),
      heightLabel: approxInches(plan.size.height),
    },
    yardage: plan.yardage.map(({ fabric, yards }) => ({ fabric, label: fabricLabel(block, fabric), yards: inches(yards) })),
    backing: {
      yards: inches(plan.backing.yards),
      panels: plan.backing.panels,
      width: approxInches(plan.backing.width),
      height: approxInches(plan.backing.height),
    },
    binding: { yards: inches(plan.binding.yards), strips: plan.binding.strips, stripWidth: inches(2.5) },
    steps: pieceSteps(block, request.size),
    hasRoundedCuts,
    suggestedSizes: hasRoundedCuts ? rulerFriendlySizes(block, request.size) : [],
  };
}
