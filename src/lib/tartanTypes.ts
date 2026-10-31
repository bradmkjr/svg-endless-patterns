import type { Locale } from "./generator";

export type TartanColor = { letter: string; color: string; warpEnds: number; weftPicks: number; yards: number };

export type TartanRequest = {
  stripes: TartanStripe[];
  /** Mirror the stripes about each end, as most tartans do. */
  mirrored: boolean;
  /** Threads per inch, both ways. */
  threadsPerInch: number;
  /** Finished cloth, in inches. */
  width: number;
  length: number;
  locale?: Locale;
};

export type TartanResult = {
  svg: { swatch: string };
  /** Threads in one full repeat, and the repeat's width on the cloth. */
  threads: number;
  repeat: string;
  order: string;
  warpEnds: number;
  weftPicks: number;
  width: string;
  length: string;
  colors: TartanColor[];
  totalYards: number;
  steps: string[];
};

export type TartanStripe = { color: string; count: number };
