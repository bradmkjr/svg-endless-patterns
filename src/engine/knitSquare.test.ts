import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import uiText from "../i18n/messages/knitSquare.json";
import { LOCALES, say, type Locale } from "./i18n";
import { DEFAULT_KNIT_SQUARE, knitSquareSize, KNIT_SQUARE_SIZES, planKnitSquare, writeKnitSquare } from "./knitSquare";
import engineText from "./messages/knitSquare.json";
import { KNIT_STITCHES, type KnitStitch } from "./stitchCatalog";
import { generateStitchPattern } from "./stitchPattern";
import { generateStitchPdf } from "./stitchPdf";
import type { KnitSquare, StitchRequest } from "./types";

const req = (stitchGauge: number, rowGauge: number, locale?: Locale): StitchRequest => ({ width: 8, length: 8, stitchGauge, rowGauge, color: "#23395d", locale });
const stitches = KNIT_STITCHES.map((s) => [s.slug, s] as const);

/** The builder's whole range. */
const STITCH_GAUGES = Array.from({ length: 39 }, (_, i) => i + 6);
const ROW_GAUGES = Array.from({ length: 55 }, (_, i) => i + 4);

const repeatOf = (s: KnitStitch) => Math.max(...s.rows.map((r) => r.length));

type Worked = { n: number; side: "right" | "wrong"; stitches: string[] };
type Read = { castOn: number; rows: Worked[]; checks: { r: number; n: number }[]; boundOff: number };

/** A regex that reads a filled-in phrase back, one capture per placeholder, plus the names in order. */
function reader(template: string) {
  const names: string[] = [];
  const source = template.replace(/[.*+?^$()|[\]\\]|\{(\w+)\}/g, (m, name) => {
    if (!name) return `\\${m}`;
    names.push(name);
    return "(.+?)";
  });
  const regex = new RegExp(`^${source}$`);
  return (text: string): Record<string, string> | null => {
    const match = regex.exec(text);
    return match && Object.fromEntries(names.map((name, i) => [name, match[i + 1]]));
  };
}

/** A plain check: vitest's `expect` is too slow for hundreds of thousands of stitches. */
function same(actual: unknown, wanted: unknown, label: string) {
  if (actual !== wanted) throw new Error(`${label}: got ${actual}, wanted ${wanted}`);
}

/** Knits the pattern as written: only the text goes in, never the plan behind it. */
function knit(square: KnitSquare, locale: Locale): Read {
  const text = engineText[locale];
  const rowRight = reader(say(locale, "stRowRight", { n: "{n}" }));
  const rowWrong = reader(say(locale, "stRowWrong", { n: "{n}" }));
  const range = reader(text.rowsRange);
  const runK = reader(say(locale, "runK", { n: "{n}" }));
  const runP = reader(say(locale, "runP", { n: "{n}" }));
  const check = reader(text.check);
  const checkLength = reader(text.checkLength);
  const castOn = reader(text.castOn);
  const bindOff = reader(text.bindOff);
  const purlBetween = reader(text.rowPurlBetween);
  const rowRepeat = reader(text.rowRepeat);
  const repeats = [reader(text.repeatOne), reader(text.repeatMany)];
  const repeatNone = reader(text.repeatNone);

  const readRuns = (written: string): string[] =>
    written.split(", ").flatMap((run) => {
      const k = runK(run);
      if (k) return Array(Number(k.n)).fill("k");
      const p = runP(run);
      if (p) return Array(Number(p.n)).fill("p");
      throw new Error(`Can't read run: ${run}`);
    });

  const readRow = (written: string, total: number): string[] => {
    if (written === say(locale, "stKnitEnd")) return Array(total).fill("k");
    const between = purlBetween(written);
    if (between) {
      const lead = readRuns(between.lead);
      const tail = readRuns(between.t);
      same(Number(between.n), tail.length, "value");
      return [...lead, ...Array(total - lead.length - tail.length).fill("p"), ...tail];
    }
    const rep = rowRepeat(written);
    if (!rep) throw new Error(`Can't read row: ${written}`);
    const lead = readRuns(rep.lead);
    const repeat = readRuns(rep.r);
    const tail = readRuns(rep.t);
    same(Number(rep.n), tail.length, written);
    const out = [...lead];
    while (out.length < total - tail.length) out.push(...repeat);
    // A repeat that overran, or stopped short, wouldn't reach "last n sts" exactly.
    same(out.length, total - tail.length, written);
    return [...out, ...tail];
  };

  const result: Read = { castOn: 0, rows: [], checks: [], boundOff: 0 };
  const add = (n: number, side: Worked["side"], worked: string[]) => {
    same(n, result.rows.length + 1, `row ${n} follows row ${result.rows.length}`);
    result.rows.push({ n, side, stitches: worked });
  };
  for (const section of square.sections) {
    for (const item of section.items) {
      const cast = castOn(item.text);
      if (cast) result.castOn = Number(cast.n);
      const label = item.label ?? "";
      const span = range(label);
      const right = rowRight(label);
      const wrong = rowWrong(label);
      if (span) {
        for (let n = Number(span.a); n <= Number(span.b); n++) add(n, n % 2 === 1 ? "right" : "wrong", readRow(item.text, result.castOn));
      }
      if (right) add(Number(right.n), "right", readRow(item.text, result.castOn));
      if (wrong) add(Number(wrong.n), "wrong", readRow(item.text, result.castOn));
      const counted = check(item.text) ?? checkLength(item.text);
      if (counted) {
        same(Number(counted.r), result.rows.length, "a check comes right after its row");
        result.checks.push({ r: Number(counted.r), n: Number(counted.n) });
      }
      const none = repeatNone(item.text);
      if (none) same(Number(none.last), result.rows.length, "value");
      for (const repeat of repeats) {
        const found = repeat(item.text);
        if (!found) continue;
        const block = result.rows.slice(Number(found.a) - 1, Number(found.b));
        const times = found.m === undefined ? 1 : Number(found.m);
        for (let t = 0; t < times; t++) for (const row of block) add(result.rows.length + 1, row.side, row.stitches);
        same(Number(found.last), result.rows.length, "value");
        same(result.rows.at(-1)!.side, "wrong", "value");
        // In some languages "1 more time" also reads as the plural phrase.
        break;
      }
      const off = bindOff(item.text);
      if (off) result.boundOff = Number(off.n);
    }
  }
  return result;
}

/** Everything a finished pattern has to get right. */
function prove(s: KnitStitch, square: KnitSquare, read: Read, label: string) {
  const plan = planKnitSquare(s, square.size, gaugeOf(square, 0), gaugeOf(square, 1));
  same(read.castOn, square.castOn, label);
  same(read.boundOff, square.castOn, label);
  same(read.rows.length, square.rows, label);
  same(read.rows.length, plan.rows, label);

  // Fits the multiple: borders, whole repeats, then any balancing stitches.
  same((square.castOn - 2 * square.sideStitches - s.extra) % repeatOf(s), 0, label);

  // Every row has every stitch.
  read.rows.forEach((row) => same(row.stitches.length, square.castOn, `${label} row ${row.n}`));
  // Stated counts are the true counts.
  if (read.checks.length < 3) throw new Error(`${label}: too few checks`);
  for (const { r, n } of read.checks) same(read.rows[r - 1].stitches.length, n, `${label} check ${r}`);

  // Sides alternate from a right-side row 1, and the last row is wrong side, so binding off is right side.
  read.rows.forEach((row) => same(row.side, row.n % 2 === 1 ? "right" : "wrong", `${label} row ${row.n}`));
  same(read.rows[0].side, "right", "value");
  same(read.rows.at(-1)!.side, "wrong", label);

  // Bottom and top borders match, and are knit all the way across.
  const b = square.sideStitches;
  const t = square.borderRows;
  same(t % 2, 0, label);
  same(t + square.bodyRows + t, square.rows, label);
  for (const row of [...read.rows.slice(0, t), ...read.rows.slice(-t)]) same(row.stitches.every((st) => st === "k"), true, `${label} row ${row.n}`);

  // Side borders are the same width, knit on both sides.
  for (const row of read.rows) {
    same(row.stitches.slice(0, b).every((st) => st === "k"), true, `${label} row ${row.n} start`);
    same(row.stitches.slice(-b).every((st) => st === "k"), true, `${label} row ${row.n} end`);
  }

  // The body is the chart, read from the right side, repeated to its last row.
  same(square.bodyRows % s.rows.length, 0, label);
  read.rows.slice(t, t + square.bodyRows).forEach((row, i) => {
    const chart = s.rows[i % s.rows.length];
    const body = row.stitches.slice(b, row.stitches.length - b);
    const shown = row.side === "right" ? [...body].reverse() : body.map((st) => (st === "k" ? "p" : "k"));
    shown.forEach((st, c) => same(st, chart[c % chart.length], `${label} row ${row.n} col ${c}`));
  });
}

/** The gauge as stated in the pattern's own numbers isn't kept on the result, so tests pass it alongside. */
const gauges = new WeakMap<KnitSquare, [number, number]>();
const gaugeOf = (square: KnitSquare, i: number) => gauges.get(square)![i];
function make(s: KnitStitch, sg: number, rg: number, size: number, locale?: Locale) {
  const square = writeKnitSquare(s, req(sg, rg, locale), size);
  gauges.set(square, [sg, rg]);
  return square;
}

describe("the written pattern, knit from its text", () => {
  it.each(stitches)("%s, across sizes and gauges", (slug, s) => {
    for (const size of [...KNIT_SQUARE_SIZES, 4, 20, 36, 80]) {
      for (const sg of [6, 7, 11, 12, 14, 18, 22, 24, 30, 44]) {
        for (const rg of [4, 5, 13, 20, 24, 33, 58]) {
          const square = make(s, sg, rg, size);
          prove(s, square, knit(square, "en"), `${slug} ${size}" ${sg}/${rg}`);
        }
      }
    }
  }, 120_000);

  it.each(LOCALES)("reads the same in %s", (locale) => {
    for (const s of KNIT_STITCHES) {
      for (const [sg, rg, size] of [[18, 24, 8], [14, 20, 6], [44, 58, 12], [6, 4, 10]]) {
        const square = make(s, sg, rg, size, locale);
        const read = knit(square, locale);
        prove(s, square, read, `${s.slug} ${locale}`);
        // Translations only change the words: the stitches are the English stitches.
        same(JSON.stringify(read.rows.map((r) => r.stitches)), JSON.stringify(knit(make(s, sg, rg, size), "en").rows.map((r) => r.stitches)), `${s.slug} ${locale}`);
      }
    }
  });
});

describe("the numbers, at every gauge the builder allows", () => {
  it.each(stitches)("%s comes out square, with even borders", (slug, s) => {
    const repW = (sg: number) => (repeatOf(s) * 4) / sg;
    const repH = (rg: number) => (s.rows.length * 4) / rg;
    for (const size of KNIT_SQUARE_SIZES) {
      for (const sg of STITCH_GAUGES) {
        for (const rg of ROW_GAUGES) {
          const plan = planKnitSquare(s, size, sg, rg);
          const label = `${slug} ${size}" ${sg}/${rg}`;
          if (Math.abs(plan.width - plan.height) > Math.max(repW(sg), repH(rg)) + 1e-9) throw new Error(`${label}: not square`);
          if (plan.repeats > 1 && Math.abs(plan.width - size) > repW(sg) / 2 + 1e-9) throw new Error(`${label}: off size`);
          same(plan.castOn, plan.bodyStitches + 2 * plan.sideStitches, label);
          same(plan.rows, plan.bodyRows + 2 * plan.borderRows, label);
          if (plan.sideStitches < 2 || plan.borderRows < 2) throw new Error(`${label}: border too small`);
          same(plan.borderRows % 2, 0, label);
          same(plan.rows % 2, 0, label);
        }
      }
    }
  }, 120_000);

  it("hits the size at everyday gauges", () => {
    for (const s of KNIT_STITCHES) {
      for (const size of KNIT_SQUARE_SIZES) {
        const plan = planKnitSquare(s, size, 18, Math.round(24 * s.rowFactor));
        expect(Math.abs(plan.width - plan.height), s.slug).toBeLessThanOrEqual(1);
        expect(Math.abs(plan.width - size), s.slug).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("what the pattern tells you", () => {
  const all = (square: KnitSquare) => square.sections.flatMap((section) => section.items.map((item) => `${item.label ?? ""} ${item.text}`)).join("\n");

  it("lists materials, gauge, size, and every stage in order", () => {
    const square = make(KNIT_STITCHES.find((s) => s.slug === "seed-stitch")!, 18, 26, 8);
    expect(square.sections.map((s) => s.heading)).toEqual(["Materials", "Gauge and size", "Abbreviations", "Cast on", "Bottom border", "Main stitch", "Top border", "Bind off", "Finishing"]);
    const text = all(square);
    for (const part of ["Worsted weight", `about ${square.yards} yards`, "US 7-9", "Tapestry needle", "18 stitches and 26 rows per 4\"", "k = knit", "long-tail", "bind off all", "weave it", "To block"]) {
      expect(text).toContain(part);
    }
    expect(square.yards).toBeGreaterThan(0);
  });

  it("uses more yarn in a larger square", () => {
    const s = KNIT_STITCHES[0];
    expect(make(s, 18, 34, 12).yards).toBeGreaterThan(make(s, 18, 34, 6).yards);
  });

  it("is a dishcloth's worth of yarn at the default", () => {
    const yards = make(KNIT_STITCHES[0], 18, 34, 8).yards;
    expect(yards).toBeGreaterThan(40);
    expect(yards).toBeLessThan(90);
  });

  it("warns when a coarse gauge can't reach the size", () => {
    const s = KNIT_STITCHES.find((k) => k.slug === "basketweave")!;
    expect(all(make(s, 6, 4, 6))).toContain("closest whole-repeat square");
    expect(all(make(s, 18, 26, 8))).not.toContain("closest whole-repeat square");
  });

  it("names the right needles at each band", () => {
    const seed = KNIT_STITCHES[0];
    expect(make(seed, 44, 58, 8).weightId).toBe("lace");
    expect(make(seed, 18, 24, 8).needle).toContain("US 7-9");
    expect(make(seed, 6, 8, 8).weightId).toBe("jumbo");
  });
});

describe("generateStitchPattern", () => {
  const seed = "seed-stitch";

  it("adds the square for knit only, at the size asked", () => {
    expect(generateStitchPattern(seed, { ...req(18, 26), squareSize: 12 }).square?.size).toBe(12);
    expect(generateStitchPattern("single-crochet", req(14, 16)).square).toBeUndefined();
  });

  it("falls back to the default for sizes it doesn't offer", () => {
    expect(generateStitchPattern(seed, req(18, 26)).square?.size).toBe(DEFAULT_KNIT_SQUARE);
    for (const bad of [7, 0, -8, NaN, 1000]) {
      expect(knitSquareSize(bad)).toBe(DEFAULT_KNIT_SQUARE);
      expect(generateStitchPattern(seed, { ...req(18, 26), squareSize: bad }).square?.size).toBe(DEFAULT_KNIT_SQUARE);
    }
  });
});

describe("pdf", () => {
  it.each(LOCALES)("builds every stitch in %s", async (locale) => {
    for (const s of KNIT_STITCHES) {
      for (const [sg, rg] of [[18, 24], [6, 4], [44, 58]]) {
        const doc = await PDFDocument.load(await generateStitchPdf(s.slug, { ...req(sg, rg, locale), squareSize: 12 }));
        expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
      }
    }
  }, 60_000);

  it("carries the square's instructions, at least a page of them", async () => {
    const plain = await generateStitchPdf("basketweave", req(18, 24));
    const doc = await PDFDocument.load(plain);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
  });
});

describe("text", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it.each(LOCALES)("%s has every key, with the same placeholders, and fits Helvetica", (locale) => {
    expect(Object.keys(engineText[locale]).sort()).toEqual(Object.keys(engineText.en).sort());
    expect(Object.keys(uiText[locale]).sort()).toEqual(Object.keys(uiText.en).sort());
    for (const [key, value] of Object.entries(engineText[locale])) {
      expect(value, key).toBeTruthy();
      expect(placeholders(value), key).toEqual(placeholders(engineText.en[key as keyof typeof engineText.en]));
      expect(value, key).toMatch(/^[\x20-\x7e -ÿ]*$/);
    }
    for (const [key, value] of Object.entries(uiText[locale])) expect(value, key).toBeTruthy();
  });

  it.each(LOCALES.filter((l) => l !== "en"))("%s is translated", (locale) => {
    const same = Object.keys(engineText.en).filter((key) => engineText[locale][key as keyof typeof engineText.en] === engineText.en[key as keyof typeof engineText.en]);
    // Only yarn weight names are shared across languages.
    expect(same.filter((key) => !key.startsWith("weight_"))).toEqual([]);
  });

  it.each(LOCALES)("%s leaves nothing unfilled, and every generated line fits Helvetica", (locale) => {
    for (const s of KNIT_STITCHES) {
      for (const [sg, rg, size] of [[18, 24, 8], [6, 4, 6], [44, 58, 12]]) {
        const square = make(s, sg, rg, size, locale);
        const text = JSON.stringify(square);
        expect(text, s.slug).not.toMatch(/\{\w+\}/);
        expect(text, s.slug).toMatch(/^[\x20-\x7e -ÿ]*$/);
      }
    }
  });
});
