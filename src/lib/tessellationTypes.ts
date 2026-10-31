import type { Locale } from "./generator";

export type TessellationColors = { background: string; primary: string; accent: string };

export type TessellationMotif = "leaf" | "fish" | "bird" | "paisley" | "flag" | "sailboat";

export type TessellationOptions = {
  groups: { id: GroupId; family: string; description: string }[];
  motifs: { id: TessellationMotif; name: string }[];
};

export type TessellationRequest = {
  motif: TessellationMotif;
  group: GroupId;
  colors: TessellationColors;
  /** Width of one repeat, in inches. Its height follows from the group's lattice. */
  repeatWidth: number;
  /** Repeats in the tile layout. */
  across: number;
  down: number;
  /** Draw the outline of every tile, that is, every copy of the fundamental domain. */
  outlines: boolean;
  locale?: Locale;
};

export type TessellationResult = {
  svg: { repeat: string; layout: string };
  group: { id: GroupId; family: string; description: string; rotationOrders: number[]; hasMirrors: boolean; hasGlides: boolean };
  motif: string;
  /** Copies of the motif in one repeat. */
  copies: number;
  width: string;
  height: string;
  layoutWidth: string;
  layoutHeight: string;
  symmetry: string[];
  steps: string[];
};

export type GroupId = "p1" | "p2" | "pm" | "pg" | "cm" | "pmm" | "pmg" | "pgg" | "cmm" | "p4" | "p4m" | "p4g" | "p3" | "p3m1" | "p31m" | "p6" | "p6m";
