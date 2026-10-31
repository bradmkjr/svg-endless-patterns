import type { Block } from "./blocks";
import { approxInches, inches } from "./format";
import { unitCount } from "./pieces";

/** Piecing steps for a block at a size: written from what the block contains. */
export function pieceSteps(block: Block, size: number): string[] {
  const unit = size / block.grid;
  const steps: string[] = ['Cut every piece from the cutting list. All seams are 1/4".'];

  const hst = block.units.filter((u) => u.kind === "hst");
  if (hst.length) {
    const trim = approxInches(hst[0].size * unit + 0.5);
    steps.push(
      `Make ${hst.length} half-square triangle unit${hst.length === 1 ? "" : "s"}: sew two triangles together along the long edge, press, and trim to ${trim}" square.`,
    );
  }
  const qst = block.units.filter((u) => u.kind === "qst");
  if (qst.length) {
    const trim = approxInches(qst[0].size * unit + 0.5);
    steps.push(
      `Make ${qst.length} quarter-square triangle unit${qst.length === 1 ? "" : "s"}: sew triangles into two pairs along a short edge, join the pairs across the center, and trim to ${trim}" square.`,
    );
  }
  const geese = block.units.filter((u) => u.kind === "goose");
  if (geese.length) {
    const long = Math.max(geese[0].w, geese[0].h) * unit + 0.5;
    const short = Math.min(geese[0].w, geese[0].h) * unit + 0.5;
    steps.push(
      `Make ${geese.length} flying geese unit${geese.length === 1 ? "" : "s"}: sew a small triangle to each short side of a large triangle, press outward, and trim to ${approxInches(long)}" x ${approxInches(short)}".`,
    );
  }
  if (unitCount(block, "sis")) {
    steps.push(
      `Make the center unit: sew a triangle to two opposite sides of the square, press outward, add the other two triangles, and trim to ${inches(size + 0.5)}" square.`,
    );
  }

  const flips = block.units.filter((u) => u.kind === "flip");
  if (flips.length) {
    steps.push(
      `Make ${flips.length} folded-corner unit${flips.length === 1 ? "" : "s"}: place a small square on a corner of a large one, right sides together, sew across its diagonal, trim 1/4" past the seam, and press outward.`,
    );
  }
  if (unitCount(block, "shape")) {
    steps.push("Print the PDF templates at 100%. Trace them onto your fabric: the solid line is the cut, and the dashed line is the seam.");
  }

  steps.push(block.assembly);
  steps.push(`Press the block. It should measure ${inches(size + 0.5)}" square before it's sewn into a quilt, and ${inches(size)}" once it is.`);
  return steps;
}
