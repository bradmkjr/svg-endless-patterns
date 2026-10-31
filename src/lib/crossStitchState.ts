import type catalog from "@/i18n/messages/crossStitch.json";
import { localeAccent } from "./localeAccent";
import { colorsUsed, decodeColors, decodeGrid, encodeGrid, hex, pick, pickFinish, sameGrid } from "./countedGrid";
import { DESIGNS } from "./crossStitchDesigns";
import type { CrossStitchRequest, Locale } from "./generator";

export { colorsUsed, GRID_OPTIONS, MAX_COLORS, MAX_GRID, MIN_GRID, removeColor, resizeGrid, setCell } from "./countedGrid";

/** The cross-stitch builder's options, motifs and share links. */

export const COUNT_OPTIONS = [11, 14, 16, 18, 22];
export const DEFAULT_COUNT = 14;
export const STRAND_OPTIONS = [1, 2, 3, 4, 6];
export const MARGIN_OPTIONS = [1, 2, 3, 4, 5, 6];
const DEFAULT_FABRIC = "#f7f3e8";

export type MotifId = keyof typeof catalog.en.motifs;
export type Motif = { id: MotifId; grid: string[]; colors: string[] };

/** Drawn for this site: none of these copies a published chart. */
export const MOTIFS: Motif[] = [
  {
    id: "rosette",
    colors: ["#23395d", "#b3403a", "#e0a526"],
    grid: [
      "..........b..........",
      "..........c..........",
      "..........c..........",
      ".......ca...ac.......",
      "....a.aac.a.caa.a....",
      ".....ab..cac..ba.....",
      "....abab..a..baba....",
      "...ca.bbbbabbbb.ac...",
      "...ac..bbaaabb..ca...",
      ".....c.baacaab.c.....",
      "bcc.aaaaacccaaaaa.ccb",
      ".....c.baacaab.c.....",
      "...ac..bbaaabb..ca...",
      "...ca.bbbbabbbb.ac...",
      "....abab..a..baba....",
      ".....ab..cac..ba.....",
      "....a.aac.a.caa.a....",
      ".......ca...ac.......",
      "..........c..........",
      "..........c..........",
      "..........b..........",
    ],
  },
  {
    id: "heart",
    colors: ["#b3262e", "#e8848a"],
    grid: [
      ".................",
      ".................",
      "...aaaa...aaaa...",
      "..aaaaaa.aaaaaa..",
      ".aabbaaaaaaaaaaa.",
      ".abbaaaaaaaaaaaa.",
      ".abaaaaaaaaaaaaa.",
      ".aaaaaaaaaaaaaaa.",
      "..aaaaaaaaaaaaa..",
      "...aaaaaaaaaaa...",
      "....aaaaaaaaa....",
      ".....aaaaaaa.....",
      "......aaaaa......",
      ".......aaa.......",
      "........a........",
      ".................",
      ".................",
    ],
  },
  {
    id: "pine",
    colors: ["#1f5c3d", "#6b4226", "#e0a526"],
    grid: [
      ".........c.........",
      "........ccc........",
      ".........a.........",
      "........aaa........",
      ".......aacaa.......",
      "......aaaaaaa......",
      ".......aaaaa.......",
      "......aaacaaa......",
      ".....aaaaaaaaa.....",
      "....aacaaaaacaa....",
      "......aaaaaaa......",
      ".....aaaaaaaaa.....",
      "....aaaacaaaaaa....",
      "...aaaaaaaaacaaa...",
      "..aaacaaaaaaaaaaa..",
      ".aaaaaaaaaaaaaaaaa.",
      "........bbb........",
      "........bbb........",
      "........bbb........",
    ],
  },
  {
    id: "cottage",
    colors: ["#d9b98a", "#9c3b2e", "#2b4a6b", "#5a4634"],
    grid: [
      "...................",
      "..............dd...",
      "..............dd...",
      ".........b....dd...",
      "........bbb...dd...",
      ".......bbbbb..dd...",
      "......bbbbbbb.dd...",
      ".....bbbbbbbbbdd...",
      "....bbbbbbbbbbb....",
      "...bbbbbbbbbbbbb...",
      "..bbbbbbbbbbbbbbb..",
      ".bbbbbbbbbbbbbbbbb.",
      "...aaaaaaaaaaaaa...",
      "...accaaaaaaacca...",
      "...accaacccaacca...",
      "...aaaaacccaaaaa...",
      "...aaaaacccaaaaa...",
      "...aaaaacccaaaaa...",
      "...................",
    ],
  },
  {
    id: "sailboat",
    colors: ["#c8452f", "#e8b92f", "#2f6f9f", "#3a2a20"],
    grid: [
      "...................",
      "...................",
      ".........d.........",
      ".........daa.......",
      ".........daaa......",
      ".........daaaa.....",
      "........bdaaaaa....",
      ".......bbdaaaaaa...",
      "......bbbdaaaaaaa..",
      ".....bbbbdaaaaaaaa.",
      "....bbbbbdaaaaaaaa.",
      ".........d.........",
      "..ddddddddddddddd..",
      "...ddddddddddddd...",
      "....ddddddddddd....",
      "c..cc...cc...cc...c",
      ".cc..cc...cc...cc..",
      "...................",
      "...................",
    ],
  },
  {
    id: "diamonds",
    colors: ["#23395d", "#2f8f9d", "#b3403a"],
    grid: [
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      "aaaaaaaaaaaaaaaaaaaaaaaaa",
      ".........................",
      "a.......a.......a.......a",
      ".a.....a.a.....a.a.....a.",
      "b.a...a.b.a...a.b.a...a.b",
      "cb.a.a.bcb.a.a.bcb.a.a.bc",
      "b.a...a.b.a...a.b.a...a.b",
      ".a.....a.a.....a.a.....a.",
      "a.......a.......a.......a",
      ".........................",
      "aaaaaaaaaaaaaaaaaaaaaaaaa",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
      ".........................",
    ],
  },
  ...DESIGNS,
];

const DEFAULT_MOTIF = MOTIFS[0];

/** What a color takes when a hand-edited grid needs one that wasn't chosen. */
const SPARE_COLORS = ["#b3262e", "#1f5c3d", "#23395d", "#e0a526", "#6b4226", "#7a4b9a", "#2f8f9d", "#1a1a1a"];

/** A motif's colors. Only the opening design varies by language. */
export function motifColors(motif: Motif, locale: Locale = "en"): string[] {
  return motif.id === DEFAULT_MOTIF.id ? motif.colors.map((color, i) => (i === motif.colors.length - 1 ? localeAccent(locale, color) : color)) : motif.colors;
}

const findMotif = (grid: string[]) => MOTIFS.find((motif) => sameGrid(motif.grid, grid));

/** The colors a grid has unless the share link says otherwise. */
function defaultColors(grid: string[], locale: Locale): string[] {
  const motif = findMotif(grid);
  return motif ? motifColors(motif, locale) : SPARE_COLORS.slice(0, Math.max(colorsUsed(grid), 1));
}

export function defaultCrossStitchState(locale: Locale = "en"): CrossStitchRequest {
  return {
    ...(locale === "en" ? {} : { locale }),
    grid: DEFAULT_MOTIF.grid,
    colors: motifColors(DEFAULT_MOTIF, locale),
    fabric: DEFAULT_FABRIC,
    count: DEFAULT_COUNT,
    strands: 2,
    margin: 3,
    finish: "frame",
  };
}

export function parseCrossStitchState(params: { get(name: string): string | null }, locale: Locale = "en"): CrossStitchRequest {
  const base = defaultCrossStitchState(locale);
  const grid = decodeGrid(params.get("g")) ?? MOTIFS.find((motif) => motif.id === params.get("m"))?.grid ?? base.grid;
  const fabric = params.get("f");
  return {
    ...(locale === "en" ? {} : { locale }),
    grid,
    colors: decodeColors(params.get("c"), colorsUsed(grid)) ?? defaultColors(grid, locale),
    fabric: fabric && /^[0-9a-f]{6}$/i.test(fabric) ? `#${fabric.toLowerCase()}` : base.fabric,
    count: pick(params.get("count"), COUNT_OPTIONS, DEFAULT_COUNT),
    strands: pick(params.get("strands"), STRAND_OPTIONS, base.strands),
    margin: pick(params.get("margin"), MARGIN_OPTIONS, base.margin),
    finish: pickFinish(params.get("finish"), base.finish),
  };
}

export function serializeCrossStitchState(state: CrossStitchRequest): string {
  const locale = state.locale ?? "en";
  const base = defaultCrossStitchState(locale);
  const params = new URLSearchParams();
  if (!sameGrid(state.grid, base.grid)) {
    const motif = findMotif(state.grid);
    if (motif) params.set("m", motif.id);
    else params.set("g", encodeGrid(state.grid));
  }
  const encoded = state.colors.map(hex).join("-");
  if (encoded !== defaultColors(state.grid, locale).map(hex).join("-")) params.set("c", encoded);
  if (state.fabric !== base.fabric) params.set("f", hex(state.fabric));
  if (state.count !== DEFAULT_COUNT) params.set("count", String(state.count));
  if (state.strands !== base.strands) params.set("strands", String(state.strands));
  if (state.margin !== base.margin) params.set("margin", String(state.margin));
  if (state.finish !== base.finish) params.set("finish", state.finish);
  return params.toString();
}
