import type { Locale, WaveColors, WaveFill, WaveFunction, WaveMix, WavesRequest } from "./generator";
import { localeAccent } from "./localeAccent";

/** The wave builder's options, default colors and share links. */

export const WAVE_OPTIONS: WaveFunction[] = ["sine", "cosine", "tangent", "square", "triangle", "sawtooth", "damped", "interference", "moire", "lissajous", "bulge"];
export const FILL_OPTIONS: WaveFill[] = ["lines", "bands"];
export const MIX_OPTIONS: WaveMix[] = ["none", "sine", "triangle", "square", "sawtooth"];
/** Whole waves across a repeat, so its edges always meet. */
export const FREQUENCY_OPTIONS = [1, 2, 3, 4, 6, 8];
export const AMPLITUDE_OPTIONS = [10, 25, 50, 75, 100, 150, 200];
export const PHASE_OPTIONS = Array.from({ length: 24 }, (_, i) => i * 15);
/** Whole waves the phase slips from top to bottom, so the repeat's top always meets its bottom. */
export const DRIFT_OPTIONS = [0, 1, 2, 3];
export const LINE_OPTIONS = [4, 8, 12, 16, 20, 24];
export const WEIGHT_OPTIONS = [2, 4, 6, 8, 10, 15, 20, 30, 40];
export const MIX_FREQUENCY_OPTIONS = [2, 3, 4, 5, 6, 8, 12, 16];
export const MIX_AMPLITUDE_OPTIONS = [10, 25, 50, 75, 100];
export const REPEAT_OPTIONS = [2, 3, 4, 5, 6, 7.5];

const COLORS: WaveColors = { background: "#f7f3ea", line: "#1f3a5f", accent: "#c8553d" };

export function defaultWavesState(locale: Locale = "en"): WavesRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    wave: "sine",
    frequency: 2,
    amplitude: 50,
    phase: 0,
    drift: 0,
    lines: 8,
    weight: 10,
    fill: "lines",
    mix: "none",
    mixFrequency: 8,
    mixAmplitude: 25,
    colors: { ...COLORS, accent: localeAccent(locale, COLORS.accent) },
    repeatWidth: 4,
  };
}

function pick<T>(raw: string | null, options: readonly T[], fallback: T, read: (raw: string) => T): T {
  if (raw === null) return fallback;
  const value = read(raw);
  return options.includes(value) ? value : fallback;
}

const decodeColor = (raw: string | null, fallback: string) => (raw && /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : fallback);

export function parseWavesState(params: { get(name: string): string | null }, locale: Locale = "en"): WavesRequest {
  const base = defaultWavesState(locale);
  return {
    ...(locale === "en" ? {} : { locale }),
    wave: pick(params.get("wave"), WAVE_OPTIONS, base.wave, (raw) => raw as WaveFunction),
    frequency: pick(params.get("n"), FREQUENCY_OPTIONS, base.frequency, Number),
    amplitude: pick(params.get("a"), AMPLITUDE_OPTIONS, base.amplitude, Number),
    phase: pick(params.get("p"), PHASE_OPTIONS, base.phase, Number),
    drift: pick(params.get("d"), DRIFT_OPTIONS, base.drift, Number),
    lines: pick(params.get("l"), LINE_OPTIONS, base.lines, Number),
    weight: pick(params.get("sw"), WEIGHT_OPTIONS, base.weight, Number),
    fill: pick(params.get("fill"), FILL_OPTIONS, base.fill, (raw) => raw as WaveFill),
    mix: pick(params.get("mix"), MIX_OPTIONS, base.mix, (raw) => raw as WaveMix),
    mixFrequency: pick(params.get("mn"), MIX_FREQUENCY_OPTIONS, base.mixFrequency, Number),
    mixAmplitude: pick(params.get("ma"), MIX_AMPLITUDE_OPTIONS, base.mixAmplitude, Number),
    colors: {
      background: decodeColor(params.get("bg"), base.colors.background),
      line: decodeColor(params.get("ln"), base.colors.line),
      accent: decodeColor(params.get("ac"), base.colors.accent),
    },
    repeatWidth: pick(params.get("r"), REPEAT_OPTIONS, base.repeatWidth, Number),
  };
}

export function serializeWavesState(state: WavesRequest): string {
  const base = defaultWavesState(state.locale);
  const params = new URLSearchParams();
  if (state.wave !== base.wave) params.set("wave", state.wave);
  if (state.frequency !== base.frequency) params.set("n", String(state.frequency));
  if (state.amplitude !== base.amplitude) params.set("a", String(state.amplitude));
  if (state.phase !== base.phase) params.set("p", String(state.phase));
  if (state.drift !== base.drift) params.set("d", String(state.drift));
  if (state.lines !== base.lines) params.set("l", String(state.lines));
  if (state.weight !== base.weight) params.set("sw", String(state.weight));
  if (state.fill !== base.fill) params.set("fill", state.fill);
  if (state.mix !== base.mix) params.set("mix", state.mix);
  if (state.mixFrequency !== base.mixFrequency) params.set("mn", String(state.mixFrequency));
  if (state.mixAmplitude !== base.mixAmplitude) params.set("ma", String(state.mixAmplitude));
  if (state.colors.background !== base.colors.background) params.set("bg", state.colors.background.slice(1));
  if (state.colors.line !== base.colors.line) params.set("ln", state.colors.line.slice(1));
  if (state.colors.accent !== base.colors.accent) params.set("ac", state.colors.accent.slice(1));
  if (state.repeatWidth !== base.repeatWidth) params.set("r", String(state.repeatWidth));
  return params.toString();
}
