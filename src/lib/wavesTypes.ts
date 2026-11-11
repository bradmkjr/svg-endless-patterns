import type { Locale } from "./generator";

export type WaveFunction = "sine" | "cosine" | "tangent" | "square" | "triangle" | "sawtooth" | "damped" | "interference" | "moire" | "lissajous" | "bulge";
export type WaveFill = "lines" | "bands";
export type WaveMix = "none" | "sine" | "triangle" | "square" | "sawtooth";

export type WaveColors = { background: string; line: string; accent: string };

export type WavesRequest = {
  wave: WaveFunction;
  /** Waves across one repeat. For Lissajous figures, the ratio frequency : frequency + 1. */
  frequency: number;
  /** Height of a wave as a percent of the space between lines. */
  amplitude: number;
  /** Degrees. */
  phase: number;
  /** Whole waves the phase slips from a repeat's top to its bottom. */
  drift: number;
  lines: number;
  /** Line width as a percent of the space between lines. */
  weight: number;
  fill: WaveFill;
  mix: WaveMix;
  mixFrequency: number;
  mixAmplitude: number;
  colors: WaveColors;
  /** Width of one repeat, in inches. */
  repeatWidth: number;
  locale?: Locale;
};

export type WavesResult = {
  svg: { repeat: string };
  wave: string;
  fill: string;
  /** The second wave's name, or empty when none is drawn. */
  mix: string;
  /** What one repeat holds, in words. */
  summary: string;
  repeat: string;
};
