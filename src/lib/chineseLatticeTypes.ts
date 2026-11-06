import type { Locale } from "./generator";

export type LatticeFramework = "square-fret" | "octagon-square" | "hexagon" | "diagonal" | "interlocking" | "ice-ray";

export type LatticeEdge = "frame" | "open";

/** Ground behind the lattice, the bars, and the panel's frame. */
export type LatticeColors = { background: string; line: string; accent: string };

export type ChineseLatticeRequest = {
  framework: LatticeFramework;
  /** Bar width, as a percent of one lattice cell's side. */
  barWidth: number;
  /** Lattice cells across one repeat. For ice-ray it sets how many pieces the ice breaks into. */
  density: number;
  /** Frames nested inside each opening that has room for them, 0 for none. */
  depth: number;
  edge: LatticeEdge;
  /** Used only by ice-ray. */
  seed: number;
  colors: LatticeColors;
  /** Width of one repeat, in inches. Its height follows from the framework. */
  repeatWidth: number;
  across: number;
  down: number;
  locale?: Locale;
};

export type ChineseLatticeResult = {
  svg: { repeat: string; panel: string };
  name: string;
  width: string;
  height: string;
  panelWidth: string;
  panelHeight: string;
  /** Bar width in inches. */
  barWidth: string;
  /** Bar length in one panel, in feet. */
  barFeet: number;
  /** Openings to cut in one repeat. */
  openings: number;
  /** Nested frames in one repeat. */
  frames: number;
  seeded: boolean;
  notes: string[];
  steps: string[];
};
