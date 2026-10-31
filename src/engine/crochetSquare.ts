/**
 * A complete crochet square, written from the catalog's consumes/makes data:
 * materials, foundation chain, every row, an edging round with its corners, and
 * finishing. Text is composed from the parts of each row, so it can't drift from
 * the counts. A row shape this file doesn't know throws, and the tests catch it.
 *
 * Crochet terms are US. Translations use each language's own stitch names.
 */
import { approxInches, inches } from "./format";
import { say, type Locale } from "./i18n";
import copy from "./messages/crochetSquare.json";
import { crochetRowParts } from "./stitchPattern";
import type { CrochetMark, CrochetRow, CrochetStitch } from "./stitchCatalog";
import type { CrochetPlan, CrochetPlanRow, StitchRequest } from "./types";

type Copy = (typeof copy)["en"];
type Key = Exclude<keyof Copy, "marks" | "ordinal" | "ordinals" | "weights">;
type Worked = Exclude<CrochetMark, "ch">;

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** How tall a stitch stands, in chains. */
const HEIGHT: Record<Worked, number> = { sc: 1, hdc: 2, dc: 3 };

const workedIn = (row: CrochetRow): Worked => {
  const mark = [...row.start.makes, ...row.repeat.makes].find((m): m is Worked => m !== "ch");
  if (!mark) throw new Error("A crochet row needs a worked stitch");
  return mark;
};

type Shape = "solid" | "spaced" | "shell";

function shapeOf(row: CrochetRow): Shape {
  const m = row.repeat.makes.join(" ");
  if (row.repeat.makes.length === 1 && row.repeat.consume === 1 && !row.end) return "solid";
  if (/^ch (sc|dc)$/.test(m) && row.repeat.consume === 2 && !row.end) return "spaced";
  if (m === "dc ch dc" && row.repeat.consume === 3 && row.end?.makes.join() === "dc") return "shell";
  throw new Error(`No wording for a crochet row repeating: ${m}`);
}

/** The turning chain every row after the first starts with, from what that row makes. */
export function turningChain(s: CrochetStitch): { chains: number; counts: "nothing" | "stitch" | "space" | "stitchAndSpace" } {
  const start = s.rows[0].start.makes;
  const height = HEIGHT[workedIn(s.rows[0])];
  const spaces = start.filter((m) => m === "ch").length;
  const chains = height + spaces;
  if (start[0] === "ch") return { chains, counts: "space" };
  if (spaces > 0) return { chains, counts: "stitchAndSpace" };
  // A dc's turning chain is as tall as the stitch, so it stands in for it. Shorter ones don't.
  return { chains, counts: start[0] === "dc" ? "stitch" : "nothing" };
}

/* ------------------------------------------------------------------ sizing */

export function sizeSquare(s: CrochetStitch, req: Pick<StitchRequest, "width" | "length" | "stitchGauge" | "rowGauge">) {
  const widthAt = (n: number) => crochetRowParts(s.first, n).makes.length;
  // One round of sc on every side: its height at this gauge comes off the body.
  const edge = (4 * Math.min(1, s.rowFactor)) / req.rowGauge;
  const wanted = (Math.max(0, req.width - 2 * edge) * req.stitchGauge) / 4;
  let n = 2;
  while (widthAt(n) < 4) n++;
  while (widthAt(n + 1) <= wanted + (widthAt(n + 1) - widthAt(n)) / 2) n++;
  const stitches = widthAt(n);
  const bodyWidth = (stitches * 4) / req.stitchGauge;
  // A square is measured against the width it actually got, so it comes out square.
  const bodyTarget = req.width === req.length ? bodyWidth : Math.max(0, req.length - 2 * edge);
  // An even count ends on a wrong-side row, so the final turn puts the right side up for the edging.
  const rows = Math.max(2, 2 * Math.round((bodyTarget * req.rowGauge) / 8));
  const bodyLength = (rows * 4) / req.rowGauge;
  return { n, stitches, rows, edge, bodyWidth, bodyLength, finishedWidth: bodyWidth + 2 * edge, finishedLength: bodyLength + 2 * edge };
}

/** Yarn by gauge, in sc. The same bands as the builder's yarn weights, plus fingering. */
function yarnFor(stitchGauge: number): { weight: keyof Copy["weights"]; hook: string } {
  if (stitchGauge >= 21) return { weight: "fingering", hook: "B-1–E-4 (2.25–3.5 mm)" };
  if (stitchGauge >= 17) return { weight: "sport", hook: "E-4–7 (3.5–4.5 mm)" };
  if (stitchGauge >= 15) return { weight: "dk", hook: "7–I-9 (4.5–5.5 mm)" };
  if (stitchGauge >= 13) return { weight: "worsted", hook: "I-9–K-10½ (5.5–6.5 mm)" };
  if (stitchGauge >= 10) return { weight: "bulky", hook: "K-10½–M-13 (6.5–9 mm)" };
  return { weight: "superBulky", hook: "M-13–Q (9–15 mm)" };
}

/** A rule of thumb: a stitch uses 4x its width plus height, a chain 2x its width, plus 10%. */
function yardsFor(makes: CrochetMark[], rows: number, chains: number, edging: number, stitchGauge: number, rowGauge: number, edge: number): number {
  const w = 4 / stitchGauge;
  const h = 4 / rowGauge;
  const worked = makes.filter((m) => m !== "ch").length;
  const spaces = makes.length - worked;
  const inches = rows * (worked * 4 * (w + h) + spaces * 2 * w) + chains * 2 * w + edging * 4 * (w + edge);
  return Math.ceil((inches * 1.1) / 36 / 5) * 5;
}

/* ---------------------------------------------------------------- wording */

function words(locale: Locale) {
  const t = copy[locale] as unknown as Copy;
  const line = (key: Key, values: Record<string, string | number> = {}) => fill(t[key], values);
  const ordinal = (k: number) => (t.ordinals as Record<string, string>)[k] ?? fill(t.ordinal, { k });
  const mark = (m: Worked) => t.marks[m];
  return { t, line, ordinal, mark };
}

type Words = ReturnType<typeof words>;

/** `*body; repeat from * k more times`, or just the body when it's only worked once. */
function repeated(w: Words, body: string, times: number): string {
  if (times <= 1) return body;
  return w.line(times === 2 ? "starOne" : "starMany", { body, k: times - 1 });
}

function firstRowText(s: CrochetStitch, n: number, w: Words): string {
  const row = s.first;
  const st = w.mark(workedIn(row));
  const times = n - row.fewer;
  const k = row.start.consume;
  const v = { one: st.one, st: st.st, ord: w.ordinal(k), k: k - 1, c: times };
  switch (shapeOf(row)) {
    case "solid":
      if (row.start.makes.length === 1 && row.start.makes[0] === "dc") {
        // The first dc of the count is the chain itself, so the next goes one chain on.
        return w.line("firstSolidCounts", { ...v, ord: w.ordinal(k + 1), k, c: times - 1 });
      }
      return w.line("firstSolid", v);
    case "spaced": {
      const body = w.line("bodyFirstSpaced", v);
      const open = row.start.makes[0] === "ch" ? "firstSpace" : "firstStitchSpace";
      return `${w.line(open, v)}, ${repeated(w, body, times)}`;
    }
    case "shell": {
      const body = w.line("bodyFirstShell", v);
      return `${w.line("firstShell", { ...v, k })}, ${repeated(w, body, times)}, ${w.line("lastCh", v)}`;
    }
  }
}

function nextRowText(s: CrochetStitch, row: CrochetRow, n: number, w: Words): string {
  const st = w.mark(workedIn(row));
  const { chains: t } = turningChain(s);
  const times = n - row.fewer;
  const v = { ...st, t, c: times };
  const countNote = w.line(t === 1 ? "noCountOne" : "noCountMany");
  switch (shapeOf(row)) {
    case "solid":
      if (row.start.makes[0] === "dc") return w.line("rowCounts", { ...v, c: times - 1 });
      return w.line(row.loop === "back" ? "rowSolidBack" : "rowSolid", { ...v, note: countNote });
    case "spaced": {
      const moss = row.start.makes[0] === "ch";
      const body = w.line(moss ? "bodyMoss" : "bodyMesh", v);
      return `${w.line(moss ? "rowMoss" : "rowMesh", v)}, ${repeated(w, body, times)}, ${w.line(moss ? "lastMoss" : "lastMesh", v)}`;
    }
    case "shell": {
      const body = w.line("bodyShell", v);
      return `${w.line("rowShell", v)}, ${repeated(w, body, times)}, ${w.line("lastShell", v)}`;
    }
  }
}

function countText(makes: CrochetMark[], w: Words): string {
  const mark = makes.find((m) => m !== "ch") as Worked;
  const worked = makes.filter((m) => m !== "ch").length;
  const spaces = makes.length - worked;
  const st = w.mark(mark).st;
  return spaces ? w.line("countMixed", { a: worked, st, b: spaces, total: makes.length }) : w.line("countSolid", { a: worked, st });
}

const planRow = (from: number, to: number, consumes: number, makes: CrochetMark[]): CrochetPlanRow => ({
  from,
  to,
  consumes,
  makes: makes.length,
  worked: makes.filter((m) => m !== "ch").length,
  spaces: makes.filter((m) => m === "ch").length,
});

/* -------------------------------------------------------------------- plan */

export function buildCrochetSquare(s: CrochetStitch, req: StitchRequest): CrochetPlan {
  if (s.rows.length !== 1) throw new Error(`${s.slug}: a square is only written for a one-row repeat`);
  const locale = req.locale ?? "en";
  const w = words(locale);
  const { n, stitches, rows, edge, bodyWidth, bodyLength, finishedWidth, finishedLength } = sizeSquare(s, req);
  const row = s.rows[0];
  const first = crochetRowParts(s.first, n);
  const next = crochetRowParts(row, n);
  const chains = s.chains(n);
  const extra = chains - stitches;
  const step = s.chains(n + 1) - chains;
  const offset = chains - step * n;
  const turn = turningChain(s);
  const sc = w.mark("sc");

  // Edging: one sc per st or space across the top and foundation, and the same density up the sides.
  const side = Math.max(3, Math.round((rows * req.stitchGauge) / req.rowGauge));
  const topBetween = stitches - 2;
  const sideBetween = side - 2;
  const edgingTotal = 2 * topBetween + 2 * sideBetween + 4 * 3;
  const yards = yardsFor(next.makes, rows, chains, edgingTotal, req.stitchGauge, req.rowGauge, edge);
  const hasSpaces = next.makes.includes("ch");

  const yarn = yarnFor(req.stitchGauge);
  const isSquare = req.width === req.length;
  const sizeText = w.line("sizeText", { w: approxInches(finishedWidth), h: approxInches(finishedLength), bw: approxInches(bodyWidth), bl: approxInches(bodyLength) });
  const abbreviations = [...say(locale, "abbrCrochet").split("|"), ...w.t.abbrExtra.split("|")];

  const turningKey = { nothing: "turnNothing", stitch: "turnStitch", space: "turnSpace", stitchAndSpace: "turnStitchSpace" } as const;
  const mainSt = w.mark(workedIn(row));
  const foundation = [
    { label: w.line("foundationLabel"), text: w.line("foundationText", { n: chains, m: stitches, x: extra }) },
    ...(step > 1 ? [{ text: w.line("multipleText", { step, offset }) }] : []),
    { label: w.line("turningLabel"), text: w.line(turningKey[turn.counts], { t: turn.chains, ...mainSt, note: w.line(turn.chains === 1 ? "noCountOne" : "noCountMany") }) },
    { text: w.line("rightSideNote") },
  ];
  const turnWord = w.line("turn");
  const row1 = { label: say(locale, "stRowRight", { n: 1 }), text: `${capitalize(firstRowText(s, n, w))}. ${turnWord} ${countText(first.makes, w)}` };
  const row2 = { label: say(locale, "stRowWrong", { n: 2 }), text: `${capitalize(nextRowText(s, row, n, w))}. ${turnWord} ${countText(next.makes, w)}` };
  const repeat =
    rows > 2
      ? {
          label: w.line("rowsRange", { r: rows }),
          text: w.line("repeatText", { k: rows - 2, r: rows }),
        }
      : { text: w.line("twoRowsText") };

  const topWhere = w.line(hasSpaces ? "eachStSpace" : "eachSt", { c: topBetween });
  const lastCorner = w.line(turn.counts === "space" ? "cornerSpace" : turn.counts === "stitchAndSpace" ? "cornerThird" : turn.counts === "stitch" ? "cornerTurning" : "cornerLast");
  const edging = [
    { text: w.line("edgeIntro", { sc: sc.st }) },
    { label: w.line("edgeTopLabel"), text: w.line("edgeTop", { one: sc.one, sc: sc.st, where: topWhere, corner: lastCorner }) },
    { label: w.line("edgeSideLabel"), text: w.line("edgeSide", { sc: sc.st, c: sideBetween, r: rows }) },
    { label: w.line("edgeBottomLabel"), text: w.line("edgeBottom", { one: sc.one, sc: sc.st, c: topBetween, x: extra }) },
    { label: w.line("edgeSide2Label"), text: w.line("edgeSide", { sc: sc.st, c: sideBetween, r: rows }) },
    { label: w.line("edgeJoinLabel"), text: w.line("edgeJoin", { sc: sc.st, total: edgingTotal, a: topBetween, b: sideBetween }) },
  ];
  const finishing = [
    { label: w.line("fastenLabel"), text: w.line("fastenText") },
    { label: w.line("weaveLabel"), text: w.line("weaveText") },
    { label: w.line("blockLabel"), text: w.line(isSquare ? "blockSquare" : "blockSize", { s: inches(Math.max(finishedWidth, finishedLength)), w: approxInches(finishedWidth), h: approxInches(finishedLength) }) },
  ];

  return {
    materials: [
      { label: w.line("yarnLabel"), text: w.line("yarnText", { weight: w.t.weights[yarn.weight], y: yards }) },
      { label: w.line("hookLabel"), text: w.line("hookText", { hook: yarn.hook }) },
      { label: w.line("notionsLabel"), text: w.line("notionsText") },
      { label: w.line("gaugeLabel"), text: `${w.line("gaugeText", { s: req.stitchGauge, r: req.rowGauge, name: s.name })}${hasSpaces ? ` ${w.line("gaugeSpaces")}` : ""}` },
      { label: w.line(isSquare ? "sizeSquareLabel" : "sizeLabel"), text: sizeText },
      { label: w.line("abbrLabel"), text: abbreviations.join("; ") },
    ],
    materialsHeading: w.line("materialsHeading"),
    sections: [
      { heading: w.line("foundationHeading"), lines: foundation },
      { heading: w.line("bodyHeading"), lines: [row1, row2, repeat] },
      { heading: w.line("edgingHeading"), lines: edging },
      { heading: w.line("finishHeading"), lines: finishing },
    ],
    data: {
      chains,
      extraChains: extra,
      stitches,
      rowCount: rows,
      turningChains: turn.chains,
      rows: [
        planRow(1, 1, first.consume, first.makes),
        planRow(2, 2, next.consume, next.makes),
        ...(rows > 2 ? [planRow(3, rows, next.consume, next.makes)] : []),
      ],
      edging: { top: topBetween, bottom: topBetween, left: sideBetween, right: sideBetween, cornerStitches: 3, total: edgingTotal },
      bodyWidth,
      bodyLength,
      finishedWidth,
      finishedLength,
      yards,
    },
  };
}

export const crochetSquareCopy = copy;
