import { approxInches, inches } from "./format";
import { say } from "./i18n";
import type { Locale } from "./i18n";

/** A tartan: colored stripes of threads, used in the same order for warp and weft. */
export type TartanStripe = { color: string; count: number };

export type TartanRequest = {
  stripes: TartanStripe[];
  /** Mirror the stripes about each end, as most tartans do. */
  mirrored: boolean;
  /** Threads per inch, both ways. */
  threadsPerInch: number;
  /** Finished cloth, in inches. */
  width: number;
  length: number;
  locale?: Locale;
};

export type TartanColor = { letter: string; color: string; warpEnds: number; weftPicks: number; yards: number };

export type TartanResult = {
  svg: { swatch: string };
  /** Threads in one full repeat, and the repeat's width on the cloth. */
  threads: number;
  repeat: string;
  order: string;
  warpEnds: number;
  weftPicks: number;
  width: string;
  length: string;
  colors: TartanColor[];
  totalYards: number;
  steps: string[];
};

/** Extra warp length tied up on the loom. A typical allowance; looms differ. */
export const LOOM_WASTE = 24;
/** Extra for take-up and mistakes. */
const ALLOWANCE = 1.1;

/** One repeat as stripes. Mirroring walks back without doubling the two end stripes. */
export function sett(stripes: TartanStripe[], mirrored: boolean): TartanStripe[] {
  return mirrored && stripes.length > 2 ? [...stripes, ...stripes.slice(1, -1).reverse()] : stripes;
}

/** One repeat as single threads: a color index per thread. */
export function threadOrder(stripes: TartanStripe[], mirrored: boolean): number[] {
  const index = new Map(stripes.map((s, i) => [s, i]));
  return sett(stripes, mirrored).flatMap((s) => Array<number>(s.count).fill(index.get(s)!));
}

/** The color showing at a crossing in a 2/2 twill: two warp threads up, two down, stepping each row. */
export function twillColor(order: number[], x: number, y: number): number {
  const warpUp = (x + y) % 4 < 2;
  return order[(warpUp ? x : y) % order.length];
}

const letter = (i: number) => String.fromCharCode(65 + i);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export function tartanTileSize(threads: number): number {
  // The thread order and the 4-thread twill must both finish for the tile to meet itself.
  return (threads * 4) / gcd(threads, 4);
}

function swatchSvg(req: TartanRequest, order: number[]): string {
  const side = tartanTileSize(order.length);
  const rows: string[] = [];
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; ) {
      const c = twillColor(order, x, y);
      let end = x + 1;
      while (end < side && twillColor(order, end, y) === c) end++;
      rows.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${req.stripes[c].color}"/>`);
      x = end;
    }
  }
  const size = side / req.threadsPerInch;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${Number(size.toFixed(3))}in" height="${Number(size.toFixed(3))}in" role="img"><title>Tartan repeat</title><g shape-rendering="crispEdges">${rows.join("")}</g></svg>`;
}

export function generateTartan(req: TartanRequest): TartanResult {
  const locale = req.locale ?? "en";
  const order = threadOrder(req.stripes, req.mirrored);
  const warpEnds = Math.max(1, Math.round(req.width * req.threadsPerInch));
  const weftPicks = Math.max(1, Math.round(req.length * req.threadsPerInch));
  const warpInches = req.length + LOOM_WASTE;

  const count = (total: number, color: number) => {
    let n = 0;
    for (let i = 0; i < total; i++) if (order[i % order.length] === color) n++;
    return n;
  };
  const colors = req.stripes.map((stripe, i) => {
    const warp = count(warpEnds, i);
    const weft = count(weftPicks, i);
    const yards = Math.ceil(((warp * warpInches + weft * req.width) * ALLOWANCE) / 36);
    return { letter: letter(i), color: stripe.color, warpEnds: warp, weftPicks: weft, yards };
  });

  const orderText = sett(req.stripes, req.mirrored)
    .map((s) => `${letter(req.stripes.indexOf(s))}${s.count}`)
    .join(" ");

  return {
    svg: { swatch: swatchSvg(req, order) },
    threads: order.length,
    repeat: approxInches(order.length / req.threadsPerInch),
    order: orderText,
    warpEnds,
    weftPicks,
    width: inches(req.width),
    length: inches(req.length),
    colors,
    totalYards: colors.reduce((sum, c) => sum + c.yards, 0),
    steps: [
      say(locale, "taStepWarp", { ends: warpEnds, len: warpInches, waste: LOOM_WASTE }),
      say(locale, "taStepOrder", { order: orderText }),
      say(locale, "taStepWeave", { picks: weftPicks, ppi: req.threadsPerInch }),
      say(locale, "taStepFinish"),
    ],
  };
}
