import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { crochetSquareCopy as copy, sizeSquare, turningChain } from "./crochetSquare";
import { CROCHET_STITCHES } from "./stitchCatalog";
import { generateStitchPattern } from "./stitchPattern";
import { generateStitchPdf } from "./stitchPdf";
import type { CrochetPlan, StitchRequest } from "./types";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const SIZES = [4, 6, 8, 10, 12, 30, 80];
const STITCH_GAUGES = [6, 8, 11, 14, 16, 18, 24, 44];
const ROW_GAUGES = [4, 5, 9, 12, 16, 20, 58];
const base: StitchRequest = { width: 8, length: 8, stitchGauge: 14, rowGauge: 16, color: "#23395d" };
const EVERY = CROCHET_STITCHES.map((s) => [s.slug, s] as const);

const plan = (slug: string, req: StitchRequest): CrochetPlan => generateStitchPattern(slug, req).crochet!;
const lines = (p: CrochetPlan, section: number) => p.sections[section].lines;

/** Follows a written English row as a crocheter would: what it uses, and what it makes. */
function follow(text: string): { consumes: number; makes: number } {
  const row = text.replace(/\. Turn\..*$/, "").replace(/, working the last \w+ in [^,]*$/, "");
  const star = /^(.*?)\*(.*); repeat from \* (\d+) more times?(.*)$/.exec(row);
  const parts = star ? [[star[1], 1], [star[2], Number(star[3]) + 1], [star[4], 1]] as const : ([[row, 1]] as const);
  let consumes = 0;
  let makes = 0;
  for (const [segment, times] of parts) {
    const piece = readSegment(segment);
    consumes += piece.consumes * times;
    makes += piece.makes * times;
  }
  return { consumes, makes };
}

function readSegment(segment: string) {
  let consumes = 0;
  let makes = 0;
  // Commas inside a turning-chain note or a V aren't separate steps.
  const clauses = segment.replace(/\(dc, ch 1, dc\)/g, "V").split(/, (?![^(]*\))/).map((c) => c.trim()).filter(Boolean);
  for (const raw of clauses) {
    const clause = raw.toLowerCase();
    let m: RegExpExecArray | null;
    if ((m = /^ch \d+ \(counts as (.*)\)$/.exec(clause))) makes += m[1].split(" and ").length;
    else if (/^ch \d+ \(does not count/.test(clause)) continue;
    else if (clause === "ch 1") makes += 1;
    else if ((m = /^skip first (\d+) ch \(they count as a dc\)$/.exec(clause))) { consumes += Number(m[1]); makes += 1; }
    else if (/^skip /.test(clause)) consumes += 1;
    else if ((m = /^(?:sc|hdc|dc) in (\d+)\w\w ch from hook(?: \(first (\d+) ch (count as|form) (.*)\))?$/.exec(clause))) {
      consumes += Number(m[1]);
      makes += 1 + (m[4] ? (m[4].includes(" and ") ? 2 : 1) : 0);
    }
    else if ((m = /^(?:sc|hdc|dc)(?: in back loop only of)?(?: in)? each of next (\d+) (?:ch|sts)$/.exec(clause))) { consumes += Number(m[1]); makes += Number(m[1]); }
    else if (/^v in next /.test(clause)) { consumes += 1; makes += 3; }
    else if (/^(sc|hdc|dc) (in )?(back loop only of )?(first st|next [\w-]+( space)?|last ch|top of turning ch)$/.test(clause)) { consumes += 1; makes += 1; }
    else throw new Error(`Can't read: ${raw}`);
  }
  return { consumes, makes };
}

describe.each(EVERY)("%s square", (slug, s) => {
  it("each row uses exactly what the one before it made, at every size and gauge", () => {
    for (const width of SIZES) {
      for (const stitchGauge of STITCH_GAUGES) {
        for (const rowGauge of ROW_GAUGES) {
          const req = { ...base, width, length: width, stitchGauge, rowGauge };
          const at = `${width}" ${stitchGauge}/${rowGauge}`;
          const { data } = plan(slug, req);
          let available = data.chains;
          for (const row of data.rows) {
            expect(row.consumes, at).toBe(available);
            expect(row.worked + row.spaces, at).toBe(row.makes);
            available = row.makes;
            expect(row.makes, at).toBe(data.stitches);
          }
          expect(data.rows[data.rows.length - 1].to, at).toBe(data.rowCount);
        }
      }
    }
  });

  it("states the counts it works to, in the words a crocheter reads", () => {
    for (const width of SIZES) {
      for (const stitchGauge of STITCH_GAUGES) {
        const p = plan(slug, { ...base, width, length: width, stitchGauge, rowGauge: 16 });
        const { data } = p;
        const [row1, row2] = lines(p, 1);
        const stated = (text: string) => {
          const m = /\[(\d+) \w+(?: and (\d+) ch-1 spaces, (\d+) in all)?\]$/.exec(text)!;
          return m[3] ? { total: Number(m[3]), a: Number(m[1]), b: Number(m[2]) } : { total: Number(m[1]), a: Number(m[1]), b: 0 };
        };
        expect(stated(row1.text).total).toBe(data.stitches);
        expect(stated(row1.text).a + stated(row1.text).b).toBe(data.stitches);
        expect(stated(row2.text).total).toBe(data.stitches);
        expect(lines(p, 0)[0].text).toContain(`Ch ${data.chains} loosely: ${data.stitches} for your stitches and spaces, plus ${data.extraChains} for turning`);
        expect(data.stitches + data.extraChains).toBe(data.chains);
        if (data.rowCount > 2) expect(lines(p, 1)[2].text).toContain(`Repeat Row 2 ${data.rowCount - 2} more times, for ${data.rowCount} rows`);
      }
    }
  });

  it("reads back to the data from the written English alone", () => {
    for (const width of [4, 6, 8, 10, 12, 30]) {
      for (const stitchGauge of [6, 14, 18, 44]) {
        const p = plan(slug, { ...base, width, length: width, stitchGauge });
        const [row1, row2] = lines(p, 1);
        expect(follow(row1.text), `row 1 at ${width}/${stitchGauge}`).toEqual({ consumes: p.data.chains, makes: p.data.stitches });
        expect(follow(row2.text), `row 2 at ${width}/${stitchGauge}`).toEqual({ consumes: p.data.stitches, makes: p.data.stitches });
      }
    }
  });

  it("ends on a wrong-side row, so the edging starts on the right side", () => {
    for (const width of SIZES) {
      for (const rowGauge of ROW_GAUGES) expect(plan(slug, { ...base, width, length: width, rowGauge }).data.rowCount % 2).toBe(0);
    }
  });

  it("edges all four sides consistently, with 3 sc in each corner", () => {
    for (const width of SIZES) {
      for (const stitchGauge of STITCH_GAUGES) {
        for (const rowGauge of ROW_GAUGES) {
          const p = plan(slug, { ...base, width, length: width, stitchGauge, rowGauge });
          const { edging: e, stitches, rowCount } = p.data;
          expect(e.top).toBe(e.bottom);
          expect(e.left).toBe(e.right);
          expect(e.top).toBe(stitches - 2);
          expect(e.left).toBeGreaterThanOrEqual(1);
          expect(e.total).toBe(e.top + e.bottom + e.left + e.right + 4 * e.cornerStitches);
          // Top and foundation take every column; the turning chains stay unworked.
          expect(e.top + 2 + p.data.extraChains).toBe(p.data.chains);
          // Sides hold the same stitch density as the top, within rounding.
          expect(Math.abs(e.left + 2 - (rowCount * stitchGauge) / rowGauge)).toBeLessThanOrEqual(2);
          const join = lines(p, 2)[5].text;
          expect(join).toContain(`[${e.total} sc: ${e.top} across the top and ${e.bottom} across the bottom, ${e.left} along each side`);
        }
      }
    }
  });

  it("finishes within one repeat of square, and near the size asked for", () => {
    const repeatWide = s.chains(3) - s.chains(2);
    for (const width of SIZES) {
      for (const stitchGauge of STITCH_GAUGES) {
        for (const rowGauge of ROW_GAUGES) {
          const req = { ...base, width, length: width, stitchGauge, rowGauge };
          const { data: d } = plan(slug, req);
          const repeatInches = Math.max((repeatWide * 4) / stitchGauge, (2 * 4) / rowGauge);
          const at = `${width}" ${stitchGauge}/${rowGauge}`;
          expect(Math.abs(d.finishedWidth - d.finishedLength), at).toBeLessThanOrEqual(repeatInches + 1e-9);
          // A piece at its minimum repeats can't shrink further, so only hold larger pieces to the target.
          const { n } = sizeSquare(s, req);
          if (n > 4) expect(Math.abs(d.finishedWidth - width), at).toBeLessThanOrEqual((repeatWide * 4) / stitchGauge + 1e-9);
        }
      }
    }
  });

  it("keeps a rectangle's numbers consistent too", () => {
    const { data: d } = plan(slug, { ...base, width: 30, length: 36 });
    expect(d.rows[0].consumes).toBe(d.chains);
    expect(d.rowCount % 2).toBe(0);
    expect(Math.abs(d.finishedLength - 36)).toBeLessThanOrEqual(0.5);
    expect(d.edging.left).toBeGreaterThan(d.edging.top);
  });

  it("gives every language the same numbers", () => {
    const en = plan(slug, { ...base, width: 10, length: 10 });
    const digits = (text: string) => (text.match(/\d+/g) ?? []).map(Number).filter((d) => d > 1).sort((a, b) => a - b);
    for (const locale of LOCALES) {
      const p = plan(slug, { ...base, width: 10, length: 10, locale });
      expect(p.data).toEqual(en.data);
      p.sections.forEach((section, i) =>
        section.lines.forEach((line, j) => {
          // Ones are left out: "1 pb" is a plain "sc" in English.
          expect(digits(line.text), `${locale}: ${line.text}`).toEqual(digits(en.sections[i].lines[j].text));
        }),
      );
    }
  });

  it("states the turning chain the way its row counts it", () => {
    const turn = turningChain(s);
    expect(turn.chains).toBeGreaterThanOrEqual(1);
    const text = lines(plan(slug, base), 1)[1].text;
    expect(text.startsWith(`Ch ${turn.chains} (`)).toBe(true);
  });
});

describe("crochet square text", () => {
  const fieldsIn = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const en = copy.en as unknown as Record<string, unknown>;

  it.each(LOCALES)("%s has every key, with the same placeholders", (locale) => {
    const t = copy[locale] as unknown as Record<string, unknown>;
    expect(Object.keys(t).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of Object.entries(en)) {
      if (typeof value === "string" && key !== "ordinal") expect(fieldsIn(t[key] as string), `${locale}.${key}`).toEqual(fieldsIn(value));
    }
  });

  it.each(LOCALES)("%s leaves nothing unfilled and fits Helvetica", async (locale) => {
    for (const [slug] of EVERY) {
      const req = { ...base, locale };
      const result = generateStitchPattern(slug, req);
      expect(JSON.stringify({ ...result, svg: null }), slug).not.toMatch(/\{\w+\}/);
      // Throws on a character the font can't encode.
      const doc = await PDFDocument.load(await generateStitchPdf(slug, req));
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps US terms in the English", () => {
    const text = JSON.stringify(plan("double-crochet", base));
    expect(text).not.toMatch(/treble|\btr\b/i);
    expect(text).toContain("Ch 3 (counts as a dc), skip first st, dc in each of next");
  });
});
