/**
 * Drawing primitives for charts, shared by SVG and PDF output, so a chart looks
 * the same in both. Units are chart cells; y grows downward.
 */
export type Mark =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; weight?: number }
  | { kind: "box"; x: number; y: number; w: number; h: number }
  | { kind: "ring"; x: number; y: number; rx: number; ry: number }
  | { kind: "label"; x: number; y: number; text: string };

export type Chart = { width: number; height: number; marks: Mark[] };

const f = (n: number) => Number(n.toFixed(4)).toString();

/** A chart cell is a quarter inch when printed or opened at full size. */
export const CELL_INCHES = 0.25;

export function chartSvg(chart: Chart, title: string): string {
  const body = chart.marks
    .map((m) => {
      switch (m.kind) {
        case "line":
          return `<line x1="${f(m.x1)}" y1="${f(m.y1)}" x2="${f(m.x2)}" y2="${f(m.y2)}" stroke="#222" stroke-width="${f(m.weight ?? 0.06)}" stroke-linecap="round"/>`;
        case "box":
          return `<rect x="${f(m.x)}" y="${f(m.y)}" width="${f(m.w)}" height="${f(m.h)}" fill="#fff" stroke="#888" stroke-width="0.03"/>`;
        case "ring":
          return `<ellipse cx="${f(m.x)}" cy="${f(m.y)}" rx="${f(m.rx)}" ry="${f(m.ry)}" fill="none" stroke="#222" stroke-width="0.05"/>`;
        case "label":
          return `<text x="${f(m.x)}" y="${f(m.y)}" font-size="0.42" font-family="Arial, sans-serif" fill="#555" text-anchor="middle" dominant-baseline="middle">${m.text}</text>`;
      }
    })
    .join("");
  const w = chart.width * CELL_INCHES;
  const h = chart.height * CELL_INCHES;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(chart.width)} ${f(chart.height)}" width="${f(w)}in" height="${f(h)}in" role="img"><title>${title}</title><rect width="${f(chart.width)}" height="${f(chart.height)}" fill="#fff"/>${body}</svg>`;
}
