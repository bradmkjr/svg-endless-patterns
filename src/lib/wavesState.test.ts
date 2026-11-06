import { describe, expect, it } from "vitest";
import uiCopy from "../i18n/messages/waves.json";
import { defaultWavesState, LINE_OPTIONS, MIX_OPTIONS, parseWavesState, serializeWavesState, WAVE_OPTIONS } from "./wavesState";
import type { WavesRequest } from "./generator";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

describe("share links", () => {
  const full: WavesRequest = {
    wave: "lissajous",
    frequency: 6,
    amplitude: 150,
    phase: 285,
    drift: 3,
    lines: 24,
    weight: 2,
    fill: "bands",
    mix: "sawtooth",
    mixFrequency: 16,
    mixAmplitude: 100,
    colors: { background: "#010203", line: "#a0b0c0", accent: "#ffeedd" },
    repeatWidth: 7.5,
  };

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    expect(serializeWavesState(defaultWavesState(locale))).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseWavesState(new URLSearchParams(serializeWavesState(state)), locale)).toEqual(state);
  });

  it("offers only line counts that wrap alternating colors and checkered figures", () => {
    for (const lines of LINE_OPTIONS) expect(lines % 4).toBe(0);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultWavesState();
    const bad = "wave=cosh&n=2.5&a=33&p=7&d=-1&l=6&sw=999&fill=dots&mix=tangent&mn=7&ma=0&bg=red&ln=12345&ac=gggggg&r=100";
    expect(parseWavesState(new URLSearchParams(bad))).toEqual(base);
    expect(parseWavesState(new URLSearchParams("l=12&sw=999")).lines).toBe(12);
    expect(parseWavesState(new URLSearchParams("l=12&sw=999")).weight).toBe(base.weight);
  });

  it("varies default colors by language", () => {
    expect(new Set(LOCALES.map((l) => JSON.stringify(defaultWavesState(l).colors))).size).toBe(7);
  });
});

describe("site text", () => {
  it.each(LOCALES)("names every wave and second wave in %s", (locale) => {
    for (const wave of WAVE_OPTIONS) expect(uiCopy[locale].waves[wave]).toBeTruthy();
    for (const mix of MIX_OPTIONS) expect(uiCopy[locale].mixes[mix]).toBeTruthy();
  });
});
