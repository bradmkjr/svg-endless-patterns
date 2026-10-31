import type { Block } from "./blocks";
import { approxInches, inches } from "./format";
import { blockText, say, type Locale } from "./i18n";
import { unitCount } from "./pieces";

/** Piecing steps for a block at a size: written from what the block contains. */
export function pieceSteps(block: Block, size: number, locale: Locale = "en"): string[] {
  const unit = size / block.grid;
  const steps: string[] = [say(locale, "stepCut")];

  const hst = block.units.filter((u) => u.kind === "hst");
  if (hst.length) steps.push(say(locale, "stepHst", { n: hst.length, trim: approxInches(hst[0].size * unit + 0.5) }));

  const qst = block.units.filter((u) => u.kind === "qst");
  if (qst.length) steps.push(say(locale, qst.length === 1 ? "stepQstOne" : "stepQstMany", { n: qst.length, trim: approxInches(qst[0].size * unit + 0.5) }));

  const geese = block.units.filter((u) => u.kind === "goose");
  if (geese.length) {
    const long = Math.max(geese[0].w, geese[0].h) * unit + 0.5;
    const short = Math.min(geese[0].w, geese[0].h) * unit + 0.5;
    steps.push(say(locale, "stepGeese", { n: geese.length, long: approxInches(long), short: approxInches(short) }));
  }
  if (unitCount(block, "sis")) steps.push(say(locale, "stepSis", { size: inches(size + 0.5) }));

  const flips = block.units.filter((u) => u.kind === "flip");
  if (flips.length) steps.push(say(locale, "stepFlip", { n: flips.length }));
  if (unitCount(block, "shape")) steps.push(say(locale, "stepTemplates"));

  steps.push(blockText(locale, block.slug)?.assembly ?? block.assembly);
  steps.push(say(locale, "stepPress", { cut: inches(size + 0.5), size: inches(size) }));
  return steps;
}
