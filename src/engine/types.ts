/**
 * The generation contract. Everything here is plain JSON, so these same shapes
 * can become the request and response bodies of a backend API.
 */

export type Setting = "straight" | "alternate" | "quadrants";

export type PatternRequest = {
  /** Finished block size, in inches. */
  size: number;
  cols: number;
  rows: number;
  sashing: number;
  border: number;
  setting: Setting;
  /** Usable width of fabric after selvages, in inches. */
  wof: number;
  /** Draw seam lines on the block, quilt and tile. */
  seams: boolean;
  /** Color per block fabric id, plus "sashing" and "border". */
  colors: Record<string, string>;
};

export type FabricInfo = { id: string; label: string };

/** A catalog entry: everything about a block except its geometry. */
export type BlockInfo = {
  slug: string;
  name: string;
  family: string;
  level: string;
  grid: number;
  fabrics: FabricInfo[];
  summary: string;
};

export type CutLine = {
  fabric: string;
  description: string;
  rounded: boolean;
};

export type PatternResult = {
  svg: { block: string; quilt: string; tile: string };
  /** Cuts for one block, then for the whole quilt top including sashing and border. */
  blockCuts: CutLine[];
  quiltCuts: CutLine[];
  quilt: {
    width: number;
    height: number;
    blocks: number;
    /** Display strings for sizes: "54" or "~54 1/8". */
    widthLabel: string;
    heightLabel: string;
  };
  yardage: { fabric: string; label: string; yards: string }[];
  backing: { yards: string; panels: number; width: string; height: string };
  binding: { yards: string; strips: number; stripWidth: string };
  steps: string[];
  /** Some cuts were rounded up because the block falls between ruler marks. */
  hasRoundedCuts: boolean;
  /** The nearest block sizes that land on ruler marks, if this one doesn't. */
  suggestedSizes: number[];
};
