/**
 * Generated text in every language. English lives here and in the catalogs;
 * `messages/` holds the translations. Pure data, so it moves with the engine.
 */
import de from "./messages/de.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";

export type Locale = "en" | "es" | "fr" | "de" | "pt";
export const LOCALES: Locale[] = ["en", "es", "fr", "de", "pt"];

const EN = {
  cutSquareOne: '{n} square, {size}"',
  cutSquareMany: '{n} squares, {size}"',
  cutOnce: ", cut once diagonally ({t} triangles)",
  cutTwice: ", cut twice diagonally ({t} triangles)",
  stripOne: '{n} strip, {w}" x {h}", joined if needed',
  stripMany: '{n} strips, {w}" x {h}", joined if needed',
  pieceOne: '{n} piece, {w}" x {h}"',
  pieceMany: '{n} pieces, {w}" x {h}"',
  cutTemplate: "{n} x {name}, cut from the PDF template",
  stepCut: 'Cut every piece from the cutting list. All seams are 1/4".',
  stepHst: 'Make {n} half-square triangle units: sew two triangles together along the long edge, press, and trim to {trim}" square.',
  stepQstOne: 'Make 1 quarter-square triangle unit: sew triangles into two pairs along a short edge, join the pairs across the center, and trim to {trim}" square.',
  stepQstMany: 'Make {n} quarter-square triangle units: sew triangles into two pairs along a short edge, join the pairs across the center, and trim to {trim}" square.',
  stepGeese: 'Make {n} flying geese units: sew a small triangle to each short side of a large triangle, press outward, and trim to {long}" x {short}".',
  stepSis: 'Make the center unit: sew a triangle to two opposite sides of the square, press outward, add the other two triangles, and trim to {size}" square.',
  stepFlip: 'Make {n} folded-corner units: place a small square on a corner of a large one, right sides together, sew across its diagonal, trim 1/4" past the seam, and press outward.',
  stepTemplates: "Print the PDF templates at 100%. Trace them onto your fabric: the solid line is the cut, and the dashed line is the seam.",
  stepPress: 'Press the block. It should measure {cut}" square before it\'s sewn into a quilt, and {size}" once it is.',
  tmplRect: "Rectangle",
  tmplSquare: "Square",
  tmplHalf: "Half-square triangle",
  tmplQuarter: "Quarter-square triangle",
  tmplFinished: "{name}, {dims} finished",
  pdfTitle: "{name} quilt pattern",
  pdfFooter: '{name}, {size}" block',
  pdfSub: '{size}" finished block. Quilt top {w}" x {h}", {n} blocks.',
  pdfBuy: "Fabric to buy",
  pdfBackingOne: 'Backing: {y} yd (1 panel, finished piece {w}" x {h}")',
  pdfBackingMany: 'Backing: {y} yd ({n} panels, finished piece {w}" x {h}")',
  pdfBinding: 'Binding: {y} yd ({n} strips, {w}" wide)',
  pdfBatting: 'Batting: at least {w}" x {h}"',
  pdfWidth: 'Based on {w}" usable fabric width. Includes a 10% allowance.',
  pdfCuts: "Cutting list, whole quilt top",
  pdfRounded: " (rounded up: trim to size)",
  pdfPiecing: "Piecing",
  pdfTemplates: "Templates",
  pdfTemplateHelp: 'Print at 100% ("actual size"), then check the 1 inch square. Solid line: cut. Dashed line: sew. Counts cover the whole quilt top.',
  pdfInch: "1 inch",
  pdfTooLarge: "Too large for one sheet, so cut these from the cutting list: {list}.",
  stRowRight: "Row {n} (right side)",
  stRowWrong: "Row {n} (wrong side)",
  stCastOn: "Cast on {n} stitches.",
  stStartKnit: "Stitches to cast on",
  stStartCrochet: "Chains to start",
  stRepeat: "Repeat rows 1 to {n} until you've worked {rows} rows.",
  stKnitEnd: "Knit to end.",
  stPurlEnd: "Purl to end.",
  stRepeatEnd: "*{r}; repeat from * to end.",
  stRepeatLastOne: "*{r}; repeat from * to last 1 st, {t}.",
  stRepeatLastMany: "*{r}; repeat from * to last {n} sts, {t}.",
  runK: "k{n}",
  runP: "p{n}",
  stFinishKnit: "Bind off in pattern, weave in the ends, and block to size.",
  stFinishCrochet: "Fasten off, weave in the ends, and block to size.",
  abbrKnit: "k = knit|p = purl|st(s) = stitch(es)",
  abbrCrochet: "US terms|ch = chain|sc = single crochet|hdc = half double crochet|dc = double crochet|st(s) = stitch(es)",
  stChain: "Ch {n}.",
  stRow1: "Row 1: {t}",
  stRowAll: "Row 2 and all following rows",
  stKeep: "Keep working until you've completed {rows} rows.",
  spTitle: "{name} pattern",
  spProject: "Your project",
  spSize: 'Finished size: {w}" x {h}"',
  spGauge: 'Gauge: {s} stitches and {r} rows per 4"',
  spRows: "Rows: {n}",
  spYarn: "Yarn: about {y} yards. This is a rough estimate, so buy extra.",
  spBefore: "Before you start",
  spBeforeText: 'Work a swatch at least 4" wide and measure it. If your gauge differs, the size and the yarn needed will change too.',
  spInstr: "Instructions",
  spChart: "Chart",
  spChartKnit: "Each square is one stitch, seen from the right side. Blank = knit, dash = purl. Start at row 1, at the bottom.",
  spChartCrochet: "The first rows at a small width. Start at row 1, at the bottom. X = sc, T = hdc, crossed T = dc, oval = ch.",
  spAbbr: "Abbreviations",
  labelSashing: "Sashing",
  labelBorder: "Border",
};

export type Phrase = keyof typeof EN;

type Catalog = {
  phrases: Record<Phrase, string>;
  fabrics: Record<string, string>;
  families: Record<string, string>;
  levels: Record<string, string>;
  templates: Record<string, string>;
  blocks: Record<string, { summary: string; assembly: string }>;
  stitches: Record<string, { summary: string; first?: string; rows?: string[] }>;
};

export const CATALOGS: Record<Exclude<Locale, "en">, Catalog> = { es, fr, de, pt };
export const ENGLISH_PHRASES = EN;

const catalog = (locale: Locale): Catalog | undefined => (locale === "en" ? undefined : CATALOGS[locale]);

/** A phrase in `locale`, with its {placeholders} filled in. */
export function say(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  const text = catalog(locale)?.phrases[key] ?? EN[key];
  return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A catalog term, falling back to English: `group` names which list it's in. */
export function term(locale: Locale, group: "fabrics" | "families" | "levels" | "templates", english: string): string {
  return catalog(locale)?.[group][english] ?? english;
}

export function blockText(locale: Locale, slug: string) {
  return catalog(locale)?.blocks[slug];
}

export function stitchText(locale: Locale, slug: string) {
  return catalog(locale)?.stitches[slug];
}
