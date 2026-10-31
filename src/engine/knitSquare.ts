import { inches } from "./format";
import { say, type Locale } from "./i18n";
import messages from "./messages/knitSquare.json";
import { repeatWidth, runs, workedRow, yardsFor } from "./stitchPattern";
import type { KnitStitch } from "./stitchCatalog";
import type { KnitSquare, KnitSquareSection, StitchRequest } from "./types";
import type { Writer } from "./pdf";

/**
 * A complete knitted square in one stitch: border, body, bind off and finishing.
 * Every row's text is written from the stitches it works, and those come from the
 * stitch's chart, so the written pattern can't drift from it.
 */

export const KNIT_SQUARE_SIZES = [6, 8, 10, 12];
export const DEFAULT_KNIT_SQUARE = 8;

type Key = keyof (typeof messages)["en"];

export function knitSquareText(locale: Locale, key: Key, values: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** Garter's row gauge compared with plain fabric, from its entry in the catalog. */
const GARTER_ROW_FACTOR = 1.4;

export type KnitSquarePlan = {
  /** Garter stitches at each side, and garter rows at the bottom and at the top. */
  sideStitches: number;
  borderRows: number;
  repeats: number;
  bodyStitches: number;
  castOn: number;
  chartRepeats: number;
  bodyRows: number;
  rows: number;
  /** Finished size in inches, at the stated gauge. */
  width: number;
  height: number;
  /** The height of the bottom border alone, in inches. */
  borderHeight: number;
};

/**
 * The numbers for a square. Width comes first, then rows are chosen to match the
 * width actually reached rather than the width asked for, so it's square even when
 * a coarse gauge pushes the size away from the target. Border rows are even, so the
 * chart starts on a right-side row and the top border ends on a wrong-side row.
 */
export function planKnitSquare(s: KnitStitch, size: number, stitchGauge: number, rowGauge: number): KnitSquarePlan {
  const rep = repeatWidth(s);
  const sideStitches = stitchGauge < 12 ? 2 : Math.max(3, Math.round((stitchGauge * 5) / 32));
  const repeats = Math.max(1, Math.round(((size * stitchGauge) / 4 - 2 * sideStitches - s.extra) / rep));
  const bodyStitches = repeats * rep + s.extra;
  const castOn = bodyStitches + 2 * sideStitches;
  const width = (castOn * 4) / stitchGauge;

  const garterRowGauge = (rowGauge * GARTER_ROW_FACTOR) / s.rowFactor;
  const wantedBorderRows = ((sideStitches * 4) / stitchGauge) * (garterRowGauge / 4);
  const borderRows = Math.max(garterRowGauge < 10 ? 2 : 4, 2 * Math.round(wantedBorderRows / 2));
  const borderHeight = (borderRows * 4) / garterRowGauge;

  const repeatHeight = (s.rows.length * 4) / rowGauge;
  const chartRepeats = Math.max(1, Math.round((width - 2 * borderHeight) / repeatHeight));
  const bodyRows = chartRepeats * s.rows.length;
  return {
    sideStitches,
    borderRows,
    repeats,
    bodyStitches,
    castOn,
    chartRepeats,
    bodyRows,
    rows: bodyRows + 2 * borderRows,
    width,
    height: 2 * borderHeight + chartRepeats * repeatHeight,
    borderHeight,
  };
}

/** The chart row a body row works, with a garter border added at each end, in working order. */
export function squareRowStitches(s: KnitStitch, chartRow: number, plan: KnitSquarePlan): ("k" | "p")[] {
  const border = Array<"k">(plan.sideStitches).fill("k");
  return [...border, ...workedRow(s, chartRow, plan.bodyStitches), ...border];
}

/** Row text for a bordered row. */
export function writeSquareRow(stitches: ("k" | "p")[], side: number, period: number, locale: Locale = "en"): string {
  if (stitches.every((st) => st === "k")) return say(locale, "stKnitEnd");
  const lead = runs(stitches.slice(0, side), locale);
  const body = stitches.slice(side, stitches.length - side);
  if (body.every((st) => st === "p")) return knitSquareText(locale, "rowPurlBetween", { lead, n: side, t: lead });
  const whole = Math.floor(body.length / period) * period;
  const last = stitches.slice(side + whole);
  return knitSquareText(locale, "rowRepeat", { lead, r: runs(body.slice(0, period), locale), n: last.length, t: runs(last, locale) });
}

/** Standard yarn bands by stitches per 4" in stockinette, each with its typical needles. */
const WEIGHTS: { min: number; id: string; key: Key; needle: string }[] = [
  { min: 33, id: "lace", key: "weight_lace", needle: "US 000-1 (1.5-2.25 mm)" },
  { min: 27, id: "fingering", key: "weight_fingering", needle: "US 1-3 (2.25-3.25 mm)" },
  { min: 23, id: "sport", key: "weight_sport", needle: "US 3-5 (3.25-3.75 mm)" },
  { min: 21, id: "dk", key: "weight_dk", needle: "US 5-7 (3.75-4.5 mm)" },
  { min: 16, id: "worsted", key: "weight_worsted", needle: "US 7-9 (4.5-5.5 mm)" },
  { min: 12, id: "bulky", key: "weight_bulky", needle: "US 9-11 (5.5-8 mm)" },
  { min: 7, id: "super-bulky", key: "weight_superBulky", needle: "US 11-17 (8-12.75 mm)" },
  { min: 0, id: "jumbo", key: "weight_jumbo", needle: "US 17+ (12.75+ mm)" },
];

/** The size asked for, or the default if it isn't one on offer. */
export function knitSquareSize(raw: number | undefined): number {
  return raw !== undefined && KNIT_SQUARE_SIZES.includes(raw) ? raw : DEFAULT_KNIT_SQUARE;
}

/** The whole pattern at `size` inches. */
export function writeKnitSquare(s: KnitStitch, req: StitchRequest, size: number): KnitSquare {
  const locale = req.locale ?? "en";
  const text = (key: Key, values: Record<string, string | number> = {}) => knitSquareText(locale, key, values);
  const plan = planKnitSquare(s, size, req.stitchGauge, req.rowGauge);
  const { sideStitches: b, borderRows: t, castOn: n, rows, bodyRows } = plan;
  const R = s.rows.length;
  const firstBody = t + 1;
  const lastBody = t + bodyRows;
  const yards = yardsFor("knit", n * (rows + 2), req);
  const weight = WEIGHTS.find((w) => req.stitchGauge >= w.min)!;
  const w = inches(plan.width);
  const h = inches(plan.height);
  const rep = repeatWidth(s);

  const check = { label: text("lCheck") };
  const bodyLines = s.rows.map((row, r) => ({
    label: say(locale, r % 2 === 0 ? "stRowRight" : "stRowWrong", { n: firstBody + r }),
    text: writeSquareRow(squareRowStitches(s, r, plan), b, row.length, locale),
  }));
  const repeat = { a: firstBody, b: firstBody + R - 1, last: lastBody, k: plan.chartRepeats, m: plan.chartRepeats - 1 };
  const uniformKnit = s.rows.every((_, r) => squareRowStitches(s, r, plan).every((st) => st === "k"));

  const sections: KnitSquareSection[] = [
    {
      heading: text("hMaterials"),
      items: [
        { label: text("lYarn"), text: text("yarn", { weight: text(weight.key), y: yards }) },
        { label: text("lNeedles"), text: text("needles", { needle: weight.needle }) },
        { label: text("lNotions"), text: text("notions") },
      ],
    },
    {
      heading: text("hSize"),
      items: [
        { label: text("lGauge"), text: text("gauge", { s: req.stitchGauge, r: req.rowGauge, name: s.name }) },
        { label: text("lFinished"), text: text("finished", { w, h }) },
        { label: text("lBorder"), text: text("border", { b, t }) },
        { label: text("lWork"), text: text("work", { n, rows }) },
        ...(Math.abs(plan.width - size) > 1 || Math.abs(plan.height - size) > 1 ? [{ label: text("lNote"), text: text("fit", { w, h, size }) }] : []),
      ],
    },
    {
      heading: text("hAbbr"),
      items: [{ text: [...say(locale, "abbrKnit").split("|"), text("abbrExtra")].join("; ") }],
    },
    {
      heading: text("hCastOn"),
      items: [
        { text: text("castOn", { n, tail: Math.ceil(plan.width * 3) }) },
        { text: s.extra ? text("castOnFitExtra", { b, k: plan.repeats, rep, e: s.extra }) : text("castOnFit", { b, k: plan.repeats, rep }) },
        { text: text("rightSide") },
      ],
    },
    {
      heading: text("hBottom"),
      items: [
        { text: text("borderIntro") },
        { label: text("rowsRange", { a: 1, b: t }), text: say(locale, "stKnitEnd") },
        { ...check, text: text("check", { r: t, n }) },
      ],
    },
    {
      heading: text("hBody"),
      items: [
        { text: text("bodyIntro", { b }) },
        ...(uniformKnit ? [{ text: text("allKnit") }] : []),
        ...bodyLines,
        ...(plan.chartRepeats > 1 ? [{ ...check, text: text("check", { r: firstBody + R - 1, n }) }] : []),
        { text: plan.chartRepeats === 1 ? text("repeatNone", repeat) : plan.chartRepeats === 2 ? text("repeatOne", repeat) : text("repeatMany", repeat) },
        { ...check, text: text("checkLength", { r: lastBody, n, h: inches(plan.height - plan.borderHeight) }) },
      ],
    },
    {
      heading: text("hTop"),
      items: [
        { text: text("topIntro") },
        { label: text("rowsRange", { a: lastBody + 1, b: rows }), text: say(locale, "stKnitEnd") },
        { ...check, text: text("checkLength", { r: rows, n, h }) },
      ],
    },
    { heading: text("hBindOff"), items: [{ text: text("bindOff", { n }) }] },
    {
      heading: text("hFinish"),
      items: [{ text: text("weave") }, { text: text("block", { w, h }) }],
    },
  ];

  return {
    title: text("title", { size }),
    size,
    castOn: n,
    rows,
    sideStitches: b,
    borderRows: t,
    bodyRows,
    width: w,
    length: h,
    yards,
    weightId: weight.id,
    needle: weight.needle,
    sections,
  };
}

export function buildKnitSquare(s: KnitStitch, req: StitchRequest): KnitSquare {
  return writeKnitSquare(s, req, knitSquareSize(req.squareSize));
}

/** The square's part of the printable pattern. `Writer` is only a type here, so pdf-lib stays out of the page bundle. */
export function drawKnitSquare(w: Writer, square: KnitSquare) {
  w.text(square.title, { size: 15, bold: true });
  w.gap(4);
  for (const section of square.sections) {
    w.text(section.heading, { size: 12, bold: true });
    for (const item of section.items) w.text(item.label ? `${item.label}: ${item.text}` : item.text);
    w.gap(6);
  }
}
