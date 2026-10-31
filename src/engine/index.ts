/**
 * Pattern generation: pure functions from a request to JSON, with no React,
 * Next or browser dependency, so it can run unchanged behind a backend API.
 * The site reaches it only through `lib/generator.ts`. The PDF lives in
 * `./pdf` so pages that never make one don't load pdf-lib.
 */
import { BLOCKS, type Block } from "./blocks";
import { blockCuts, describeCut, planQuilt, rulerFriendlySizes, type Cut } from "./cutting";
import { approxInches, inches } from "./format";
import { blockText, say, term, type Locale } from "./i18n";
import { pieceSteps } from "./steps";
import { blockSvg, quiltSvg, tileSvg } from "./svg";
import type { BlockInfo, CutLine, PatternRequest, PatternResult } from "./types";

export type * from "./types";
export { LOCALES } from "./i18n";
export { generateCrossStitch } from "./crossStitch";
export type { CrossStitchColor, CrossStitchCraft, CrossStitchRequest, CrossStitchResult } from "./crossStitch";
export { generateTessellation, listTessellationOptions } from "./tessellation";
export type { TessellationColors, TessellationMotif, TessellationOptions, TessellationRequest, TessellationResult } from "./tessellation";
export type { GroupId } from "./wallpaper";
export { generateSashiko } from "./sashiko";
export type { SashikoMotif, SashikoRequest, SashikoResult } from "./sashiko";
export { generateCelticKnot } from "./celticKnot";
export type { CelticBreakPattern, CelticInterlace, CelticKnotRequest, CelticKnotResult, CelticStrand } from "./celticKnot";
export { generateStainedGlass } from "./stainedGlass";
export type { StainedGlassColor, StainedGlassLayout, StainedGlassPiece, StainedGlassRequest, StainedGlassResult } from "./stainedGlass";
export { generateMandala } from "./mandala";
export type { MandalaMotif, MandalaRequest, MandalaResult, MandalaRing } from "./mandala";
export { generateTartan } from "./tartan";
export type { TartanRequest, TartanResult, TartanStripe } from "./tartan";
export { generateStitchPattern, listStitchPatterns } from "./stitchPattern";

// Block names stay in English in every language: they're traditional names people search by.
function toInfo({ slug, name, family, level, grid, fabrics, summary }: Block, locale: Locale): BlockInfo {
  return {
    slug,
    name,
    family: term(locale, "families", family),
    level: term(locale, "levels", level),
    grid,
    fabrics: fabrics.map((f) => ({ id: f.id, label: term(locale, "fabrics", f.label) })),
    summary: blockText(locale, slug)?.summary ?? summary,
  };
}

export function listBlocks(locale: Locale = "en"): BlockInfo[] {
  return BLOCKS.map((block) => toInfo(block, locale));
}

export function fabricLabel(block: Block, id: string, locale: Locale = "en"): string {
  if (id === "sashing") return say(locale, "labelSashing");
  if (id === "border") return say(locale, "labelBorder");
  const label = block.fabrics.find((f) => f.id === id)?.label;
  return label ? term(locale, "fabrics", label) : id;
}

export function requireBlock(slug: string): Block {
  const block = BLOCKS.find((b) => b.slug === slug);
  if (!block) throw new Error(`Unknown block: ${slug}`);
  return block;
}


export function generatePattern(slug: string, request: PatternRequest): PatternResult {
  const block = requireBlock(slug);
  const locale = request.locale ?? "en";
  const toLine = (cut: Cut): CutLine => ({ fabric: cut.fabric, description: describeCut(cut, locale), rounded: cut.rounded });
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
    yardage: plan.yardage.map(({ fabric, yards }) => ({ fabric, label: fabricLabel(block, fabric, locale), yards: inches(yards) })),
    backing: {
      yards: inches(plan.backing.yards),
      panels: plan.backing.panels,
      width: approxInches(plan.backing.width),
      height: approxInches(plan.backing.height),
    },
    binding: { yards: inches(plan.binding.yards), strips: plan.binding.strips, stripWidth: inches(2.5) },
    steps: pieceSteps(block, request.size, locale),
    hasRoundedCuts,
    suggestedSizes: hasRoundedCuts ? rulerFriendlySizes(block, request.size) : [],
  };
}
