import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/life.json";
import { CELL_SIZE_OPTIONS, COUNT_OPTIONS, defaultLifeState, LIFE_GRID, LIFE_PERIOD, parseLifeState, PATTERN_OPTIONS, phaseOptions, serializeLifeState, SPACING_OPTIONS } from "./lifeState";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;

describe("share links", () => {
  const parse = (query: string, locale?: (typeof LOCALES)[number]) => parseLifeState(new URLSearchParams(query), locale);

  it.each(LOCALES)("has an empty link for the %s defaults", (locale) => {
    expect(serializeLifeState(defaultLifeState(locale))).toBe("");
    expect(parse("", locale)).toEqual(defaultLifeState(locale));
  });

  it("round trips every setting on every pattern", () => {
    for (const pattern of PATTERN_OPTIONS) {
      const state = {
        ...defaultLifeState("en", pattern),
        phase: LIFE_PERIOD[pattern] - 1,
        cellSize: CELL_SIZE_OPTIONS.at(-1)!,
        columns: COUNT_OPTIONS[0],
        rows: COUNT_OPTIONS.at(-1)!,
        spacing: SPACING_OPTIONS.at(-1)!,
        gridLines: true,
        neighborhood: "von-neumann" as const,
        cellX: LIFE_GRID[pattern].cols - 1,
        cellY: 0,
        colors: { background: "#010203", primary: "#a0b0c0", accent: "#ffeedd" },
      };
      expect(parse(serializeLifeState(state))).toEqual(state);
    }
  });

  it.each(["p=glider", "f=9", "f=-1", "f=0.5", "f=", "s=0.3", "c=0", "c=1000", "r=7", "g=1", "g=0", "l=yes", "n=hex", "x=99", "y=-1", "x=1.5", "bg=red", "c1=12345", "c2=%22"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultLifeState());
  });

  it("keeps a phase or cell only if the pattern has it", () => {
    expect(parse("p=block&f=1").phase).toBe(0);
    expect(parse("p=blinker&f=1").phase).toBe(1);
    expect(parse("p=pulsar&f=2").phase).toBe(2);
    expect(parse("p=blinker&f=2").phase).toBe(0);
    expect(parse("p=block&x=10").cellX).toBe(defaultLifeState("en", "block").cellX);
    expect(parse("x=10").cellX).toBe(10);
  });

  it("starts each pattern on a cell of its own grid", () => {
    for (const pattern of PATTERN_OPTIONS) {
      const { cellX, cellY } = defaultLifeState("en", pattern);
      expect(cellX).toBeLessThan(LIFE_GRID[pattern].cols);
      expect(cellY).toBeLessThan(LIFE_GRID[pattern].rows);
      expect(phaseOptions(pattern)).toHaveLength(LIFE_PERIOD[pattern]);
    }
  });

  it("changes only the secondary color by language", () => {
    for (const locale of LOCALES) {
      expect(defaultLifeState(locale).colors.primary).toBe(defaultLifeState().colors.primary);
      expect(defaultLifeState(locale).colors.background).toBe(defaultLifeState().colors.background);
    }
    expect(defaultLifeState("fr").colors.accent).not.toBe(defaultLifeState().colors.accent);
  });

  it("has no seed", () => {
    expect(JSON.stringify(defaultLifeState())).not.toContain("seed");
  });
});

describe("translation", () => {
  const flat = (value: object, prefix = ""): Record<string, string> => Object.fromEntries(Object.entries(value).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v]] : Object.entries(flat(v, `${prefix}${k}.`)))));
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
    const english = flat(uiText.en);
    const text = flat(uiText[locale]);
    expect(Object.keys(text).sort()).toEqual(Object.keys(english).sort());
    for (const [name, value] of Object.entries(english)) {
      expect(text[name], name).toBeTruthy();
      expect(placeholders(text[name]), name).toEqual(placeholders(value));
    }
  });
});
