import type { CrochetMark, CrochetRow, CrochetStitch, KnitStitch, Stitch } from "./stitchCatalog";
import { STITCHES } from "./stitchCatalog";
import { approxInches } from "./format";
import { chartSvg, type Chart, type Mark } from "./stitchMarks";
import type { StitchInfo, StitchRequest, StitchResult } from "./types";

function toInfo({ slug, name, craft, level, summary, rowFactor }: Stitch): StitchInfo {
  return { slug, name, craft, level, summary, rowFactor };
}

export function listStitchPatterns(): StitchInfo[] {
  return STITCHES.map(toInfo);
}

export function requireStitch(slug: string): Stitch {
  const stitch = STITCHES.find((s) => s.slug === slug);
  if (!stitch) throw new Error(`Unknown stitch pattern: ${slug}`);
  return stitch;
}

/* ---------------------------------------------------------------- knitting */

const repeatWidth = (s: KnitStitch) => Math.max(...s.rows.map((r) => r.length));

/** Whether chart row `r` shows a knit at column `c`, from the right side. */
function chartAt(s: KnitStitch, r: number, c: number): "k" | "p" {
  const row = s.rows[r];
  return row[c % row.length] as "k" | "p";
}

/** The stitches to work in row `r`, in working order. Wrong-side rows read the other way, swapped. */
export function workedRow(s: KnitStitch, r: number, total: number): ("k" | "p")[] {
  const out: ("k" | "p")[] = [];
  const rightSide = r % 2 === 0;
  for (let i = 0; i < total; i++) {
    const c = rightSide ? total - 1 - i : i;
    const shown = chartAt(s, r, c);
    out.push(rightSide ? shown : shown === "k" ? "p" : "k");
  }
  return out;
}

const runs = (stitches: string[]) => {
  const out: string[] = [];
  let i = 0;
  while (i < stitches.length) {
    let j = i;
    while (j < stitches.length && stitches[j] === stitches[i]) j++;
    out.push(`${stitches[i]}${j - i}`);
    i = j;
  }
  return out.join(", ");
};

/** Row text for a row of `stitches`: a repeat from * and whatever's left over. */
export function writeKnitRow(stitches: ("k" | "p")[], period: number): string {
  if (stitches.every((st) => st === "k")) return "Knit to end.";
  if (stitches.every((st) => st === "p")) return "Purl to end.";
  const whole = Math.floor(stitches.length / period);
  const tail = stitches.slice(whole * period);
  const repeat = runs(stitches.slice(0, period));
  if (tail.length === 0) return `*${repeat}; repeat from * to end.`;
  return `*${repeat}; repeat from * to last ${tail.length} st${tail.length === 1 ? "" : "s"}, ${runs(tail)}.`;
}

function knitChart(s: KnitStitch): Chart {
  const width = repeatWidth(s);
  const height = s.rows.length;
  const marks: Mark[] = [];
  // Row 1 at the bottom, numbered on the side you start from.
  for (let r = 0; r < height; r++) {
    const y = height - 1 - r;
    for (let c = 0; c < width; c++) {
      marks.push({ kind: "box", x: c + 1, y, w: 1, h: 1 });
      if (chartAt(s, r, c) === "p") marks.push({ kind: "line", x1: c + 1.25, y1: y + 0.5, x2: c + 1.75, y2: y + 0.5 });
    }
    marks.push({ kind: "label", x: r % 2 === 0 ? width + 1.5 : 0.5, y: y + 0.5, text: String(r + 1) });
  }
  return { width: width + 2, height, marks };
}

/* ----------------------------------------------------------------- crochet */

/** A row's marks and how many stitches below it uses, for `n` repeats. */
export function crochetRowParts(row: CrochetRow, n: number) {
  const count = n - row.fewer;
  const makes: CrochetMark[] = [...row.start.makes];
  for (let i = 0; i < count; i++) makes.push(...row.repeat.makes);
  if (row.end) makes.push(...row.end.makes);
  return { makes, consume: row.start.consume + count * row.repeat.consume + (row.end?.consume ?? 0) };
}

function crochetMark(mark: CrochetMark, x: number, y: number): Mark[] {
  const cx = x + 0.5;
  const top = y + 0.12;
  const base = y + 0.88;
  switch (mark) {
    case "ch":
      return [{ kind: "ring", x: cx, y: y + 0.5, rx: 0.26, ry: 0.15 }];
    case "sc":
      return [
        { kind: "line", x1: cx - 0.24, y1: y + 0.26, x2: cx + 0.24, y2: y + 0.74 },
        { kind: "line", x1: cx + 0.24, y1: y + 0.26, x2: cx - 0.24, y2: y + 0.74 },
      ];
    case "hdc":
      return [
        { kind: "line", x1: cx, y1: top, x2: cx, y2: base },
        { kind: "line", x1: cx - 0.26, y1: top, x2: cx + 0.26, y2: top },
      ];
    case "dc":
      return [
        { kind: "line", x1: cx, y1: top, x2: cx, y2: base },
        { kind: "line", x1: cx - 0.26, y1: top, x2: cx + 0.26, y2: top },
        { kind: "line", x1: cx - 0.17, y1: y + 0.56, x2: cx + 0.17, y2: y + 0.44 },
      ];
  }
}

function crochetChart(s: CrochetStitch): Chart {
  const shownRows = 4;
  const n = 3;
  const rows = [s.first, ...Array.from({ length: shownRows - 1 }, (_, i) => s.rows[i % s.rows.length])];
  const width = Math.max(...rows.map((r) => crochetRowParts(r, n).makes.length));
  const marks: Mark[] = [];
  rows.forEach((row, r) => {
    const y = shownRows - 1 - r;
    const { makes } = crochetRowParts(row, n);
    // Odd rows run right to left, so their first stitch sits at the right.
    const ordered = r % 2 === 0 ? [...makes].reverse() : makes;
    ordered.forEach((mark, c) => marks.push(...crochetMark(mark, c + 1, y)));
    marks.push({ kind: "label", x: r % 2 === 0 ? width + 1.5 : 0.5, y: y + 0.5, text: String(r + 1) });
  });
  return { width: width + 2, height: shownRows, marks };
}

/* ------------------------------------------------------------------ swatch */

const f = (n: number) => Number(n.toFixed(3)).toString();

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  const v = (channel((n >> 16) & 255) << 16) | (channel((n >> 8) & 255) << 8) | channel(n & 255);
  return `#${v.toString(16).padStart(6, "0")}`;
}

/** An illustration of the texture, in true proportion at this gauge, that repeats without an edge. */
function swatchSvg(s: Stitch, req: StitchRequest): string {
  const stitchW = 4 / req.stitchGauge;
  const rowH = 4 / req.rowGauge;
  const light = shade(req.color, 0.1);
  const dark = shade(req.color, -0.16);
  let body = "";
  let width: number;
  let height: number;

  if (s.craft === "knit") {
    const cols = repeatWidth(s);
    width = cols * stitchW;
    height = s.rows.length * rowH;
    s.rows.forEach((_, r) => {
      const y = height - (r + 1) * rowH;
      for (let c = 0; c < cols; c++) {
        const x = c * stitchW;
        if (chartAt(s, r, c) === "k") {
          body += `<rect x="${f(x)}" y="${f(y)}" width="${f(stitchW)}" height="${f(rowH)}" fill="${req.color}"/>`;
          body += `<path d="M${f(x + stitchW * 0.14)} ${f(y + rowH)}L${f(x + stitchW / 2)} ${f(y + rowH * 0.1)}L${f(x + stitchW * 0.86)} ${f(y + rowH)}" fill="none" stroke="${light}" stroke-width="${f(stitchW * 0.14)}"/>`;
        } else {
          body += `<rect x="${f(x)}" y="${f(y)}" width="${f(stitchW)}" height="${f(rowH)}" fill="${dark}"/>`;
          body += `<rect x="${f(x)}" y="${f(y + rowH * 0.32)}" width="${f(stitchW)}" height="${f(rowH * 0.36)}" rx="${f(rowH * 0.18)}" fill="${req.color}"/>`;
        }
      }
    });
  } else {
    const repeatRows = [...s.rows, ...s.rows].slice(0, 2);
    const cols = repeatRows[0].repeat.makes.length;
    const across = Math.max(2, Math.ceil(4 / cols));
    width = across * cols * stitchW;
    height = repeatRows.length * rowH;
    body += `<rect width="${f(width)}" height="${f(height)}" fill="${dark}"/>`;
    repeatRows.forEach((row, r) => {
      const y = height - (r + 1) * rowH;
      for (let a = 0; a < across; a++) {
        row.repeat.makes.forEach((mark, i) => {
          const x = (a * cols + i) * stitchW;
          if (mark === "ch") {
            body += `<rect x="${f(x)}" y="${f(y + rowH * 0.8)}" width="${f(stitchW)}" height="${f(rowH * 0.16)}" fill="${req.color}"/>`;
          } else {
            const inset = stitchW * 0.1;
            body += `<rect x="${f(x + inset)}" y="${f(y + rowH * 0.04)}" width="${f(stitchW - 2 * inset)}" height="${f(rowH * 0.92)}" rx="${f(stitchW * 0.2)}" fill="${req.color}" stroke="${light}" stroke-width="${f(stitchW * 0.06)}"/>`;
          }
        });
      }
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(width)} ${f(height)}" width="${f(width)}in" height="${f(height)}in" role="img"><title>${s.name} swatch</title>${body}</svg>`;
}

/* ----------------------------------------------------------------- project */

/** Yarn in a stitch, as a multiple of its width plus height. A rule of thumb, not a measurement. */
const YARN_FACTOR = { knit: 2.6, crochet: 4 };

function yardsFor(craft: Stitch["craft"], stitches: number, req: StitchRequest): number {
  const perStitch = YARN_FACTOR[craft] * (4 / req.stitchGauge + 4 / req.rowGauge);
  const yards = (stitches * perStitch * 1.1) / 36;
  return Math.ceil(yards / 5) * 5;
}

/** The chart for a stitch, as drawing marks. */
export function stitchChart(s: Stitch): Chart {
  return s.craft === "knit" ? knitChart(s) : crochetChart(s);
}

export function generateStitchPattern(slug: string, req: StitchRequest): StitchResult {
  const s = requireStitch(slug);
  const wantedStitches = (req.width * req.stitchGauge) / 4;
  const wantedRows = (req.length * req.rowGauge) / 4;
  const swatch = swatchSvg(s, req);

  if (s.craft === "knit") {
    const rep = repeatWidth(s);
    const n = Math.max(1, Math.round((wantedStitches - s.extra) / rep));
    const total = n * rep + s.extra;
    const rows = Math.max(1, Math.ceil(wantedRows / s.rows.length)) * s.rows.length;
    const pattern = s.rows.map((row, r) => ({
      label: `Row ${r + 1} (${r % 2 === 0 ? "right side" : "wrong side"})`,
      text: writeKnitRow(workedRow(s, r, total), row.length),
    }));
    return {
      svg: { chart: chartSvg(knitChart(s), `${s.name} chart`), swatch },
      startCount: total,
      startLabel: "Stitches to cast on",
      stitchesPerRow: total,
      rows,
      width: approxInches((total * 4) / req.stitchGauge),
      length: approxInches((rows * 4) / req.rowGauge),
      yards: yardsFor("knit", total * rows, req),
      setup: [`Cast on ${total} stitches.`],
      pattern,
      repeatNote: `Repeat ${s.rows.length === 1 ? "this row" : `rows 1 to ${s.rows.length}`} until you've worked ${rows} rows.`,
      finish: ["Bind off in pattern, weave in the ends, and block to size."],
      abbreviations: ["k = knit", "p = purl", "st(s) = stitch(es)"],
    };
  }

  // Crochet: repeats come from what a row spans at the wanted stitch count.
  const widthAt = (n: number) => crochetRowParts(s.first, n).makes.length;
  let n = 1;
  while (widthAt(n + 1) <= wantedStitches + (widthAt(n + 1) - widthAt(n)) / 2) n++;
  const stitches = widthAt(n);
  const rowSet = s.rows.length;
  const after = Math.max(0, Math.ceil((wantedRows - 1) / rowSet)) * rowSet;
  const rows = 1 + after;
  const label = (i: number) => (rowSet === 1 ? `Row 2 and all following rows` : `Row ${i + 2}`);
  return {
    svg: { chart: chartSvg(crochetChart(s), `${s.name} chart`), swatch },
    startCount: s.chains(n),
    startLabel: "Chains to start",
    stitchesPerRow: stitches,
    rows,
    width: approxInches((stitches * 4) / req.stitchGauge),
    length: approxInches((rows * 4) / req.rowGauge),
    yards: yardsFor("crochet", stitches * rows, req),
    setup: [`Ch ${s.chains(n)}.`, `Row 1: ${s.first.text}`],
    pattern: s.rows.map((row, i) => ({ label: label(i), text: row.text })),
    repeatNote: `Keep working until you've completed ${rows} rows.`,
    finish: ["Fasten off, weave in the ends, and block to size."],
    abbreviations: ["US terms", "ch = chain", "sc = single crochet", "hdc = half double crochet", "dc = double crochet", "st(s) = stitch(es)"],
  };
}
