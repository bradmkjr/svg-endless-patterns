import { describe, expect, it } from "vitest";
import uiText from "@/i18n/messages/life.json";
import { CELL_SIZE_OPTIONS, COUNT_OPTIONS, defaultLifeState, lifeGenerations, lifeGrid, MAX_GENERATIONS, parseLifeState, PATTERN_OPTIONS, phaseOptions, SEED_MAX, serializeLifeState, SPACING_OPTIONS, withRun, wraps } from "./lifeState";

const LOCALES = ["en", "es", "fr", "de", "pt", "it", "nl"] as const;

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
        phase: lifeGenerations(pattern, SPACING_OPTIONS.at(-1)!) - 1,
        cellSize: CELL_SIZE_OPTIONS.at(-1)!,
        columns: COUNT_OPTIONS[0],
        rows: COUNT_OPTIONS.at(-1)!,
        spacing: SPACING_OPTIONS.at(-1)!,
        gridLines: true,
        neighborhood: "von-neumann" as const,
        cellX: lifeGrid(pattern, SPACING_OPTIONS.at(-1)!).cols - 1,
        cellY: 0,
        ...(pattern === "noise" ? { seed: SEED_MAX } : {}),
        colors: { background: "#010203", primary: "#a0b0c0", accent: "#ffeedd" },
      };
      expect(parse(serializeLifeState(state))).toEqual(state);
    }
  });

  it.each(["p=lwss", "f=9", "f=-1", "f=0.5", "f=", "s=0.3", "c=0", "c=1000", "r=7", "g=1", "g=0", "l=yes", "n=hex", "x=99", "y=-1", "x=1.5", "bg=red", "c1=12345", "c2=%22"])("ignores the bad value %s", (query) => {
    expect(parse(query)).toEqual(defaultLifeState());
  });

  it("keeps a phase or cell only if the pattern has it", () => {
    expect(parse("p=block&f=1").phase).toBe(0);
    expect(parse("p=blinker&f=1").phase).toBe(1);
    expect(parse("p=pulsar&f=2").phase).toBe(2);
    expect(parse("p=blinker&f=2").phase).toBe(0);
    expect(parse("p=block&x=10").cellX).toBe(defaultLifeState("en", "block").cellX);
    expect(parse("x=10").cellX).toBe(10);
    // A glider's run and grid grow with its tile: 4 generations for each cell across.
    expect(parse("p=glider&f=23").phase).toBe(23);
    expect(parse("p=glider&f=24").phase).toBe(0);
    expect(parse("p=glider&g=8&f=43&x=10").phase).toBe(43);
    expect(parse("p=glider&g=8&f=43&x=10").cellX).toBe(10);
    expect(parse("p=glider&x=10").cellX).toBe(defaultLifeState("en", "glider").cellX);
    expect(parse("p=gun&f=29&x=40").phase).toBe(29);
    expect(parse(`p=noise&f=${MAX_GENERATIONS - 1}`).phase).toBe(MAX_GENERATIONS - 1);
    expect(parse(`p=noise&f=${MAX_GENERATIONS}`).phase).toBe(0);
  });

  it("keeps a seed only on noise, and only a whole number in range", () => {
    expect(parse("p=noise&seed=42").seed).toBe(42);
    expect(parse("p=noise").seed).toBe(defaultLifeState("en", "noise").seed);
    for (const bad of ["-1", "1.5", "x", "", String(SEED_MAX + 1)]) expect(parse(`p=noise&seed=${bad}`).seed).toBe(defaultLifeState("en", "noise").seed);
    expect(parse("p=glider&seed=42").seed).toBeUndefined();
    expect(serializeLifeState(defaultLifeState("en", "glider"))).not.toContain("seed");
  });

  it("starts a wrapping run over when its spacing or seed changes, keeping the cell on the grid", () => {
    const state = { ...defaultLifeState("en", "glider"), spacing: 8, phase: 40, cellX: 10, cellY: 10 };
    expect(withRun(state, { spacing: 2 })).toMatchObject({ spacing: 2, phase: 0, cellX: 4, cellY: 4 });
    expect(withRun({ ...defaultLifeState("en", "noise"), phase: 9 }, { seed: 5 })).toMatchObject({ seed: 5, phase: 0 });
    // An open pattern's run doesn't depend on its spacing.
    expect(withRun({ ...defaultLifeState(), phase: 2 }, { spacing: 8 }).phase).toBe(2);
    for (const pattern of PATTERN_OPTIONS) for (const spacing of SPACING_OPTIONS) {
      const grid = lifeGrid(pattern, spacing);
      expect(grid.cols > 0 && grid.rows > 0).toBe(true);
      if (!wraps(pattern)) expect(grid).toEqual(lifeGrid(pattern, 3));
    }
  });

  it("starts each pattern on a cell of its own grid", () => {
    for (const pattern of PATTERN_OPTIONS) {
      const { cellX, cellY } = defaultLifeState("en", pattern);
      // The smallest spacing makes the smallest wrapping tile, and the cell must be on it too.
      expect(cellX).toBeLessThan(lifeGrid(pattern, SPACING_OPTIONS[0]).cols);
      expect(cellY).toBeLessThan(lifeGrid(pattern, SPACING_OPTIONS[0]).rows);
      expect(phaseOptions(pattern)).toHaveLength(lifeGenerations(pattern, 3));
    }
  });

  it("changes only the secondary color by language", () => {
    for (const locale of LOCALES) {
      expect(defaultLifeState(locale).colors.primary).toBe(defaultLifeState().colors.primary);
      expect(defaultLifeState(locale).colors.background).toBe(defaultLifeState().colors.background);
    }
    expect(defaultLifeState("fr").colors.accent).not.toBe(defaultLifeState().colors.accent);
  });

  it("has no seed except on noise", () => {
    for (const pattern of PATTERN_OPTIONS) expect(JSON.stringify(defaultLifeState("en", pattern)).includes("seed")).toBe(pattern === "noise");
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
