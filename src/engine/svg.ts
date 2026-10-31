import type { Block } from "./blocks";
import { blockPieces, type Piece } from "./pieces";
import { quiltSize } from "./cutting";
import type { PatternRequest, Setting } from "./types";

const fmt = (n: number) => Number(n.toFixed(4)).toString();
const SEAM = "rgba(0,0,0,0.45)";
/**
 * Same-color stroke that closes the antialiasing gaps between shapes. It scales
 * with the drawing, so the gaps stay closed however small the preview is.
 */
const closeGap = (span: number) => fmt(span / 400);

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function piecesMarkup(pieces: Piece[], scale: number, colors: Record<string, string>, seams: boolean, span: number): string {
  return pieces
    .map((p) => {
      const color = colors[p.fabric] ?? "#cccccc";
      const pts = p.points.map(([x, y]) => `${fmt(x * scale)},${fmt(y * scale)}`).join(" ");
      return `<polygon points="${pts}" fill="${color}" stroke="${color}" stroke-width="${closeGap(span)}"/>`;
    })
    .concat(
      seams
        ? pieces.map((p) => {
            const pts = p.points.map(([x, y]) => `${fmt(x * scale)},${fmt(y * scale)}`).join(" ");
            return `<polygon points="${pts}" fill="none" stroke="${SEAM}" stroke-width="${fmt(span / 500)}"/>`;
          })
        : [],
    )
    .join("");
}

/** Sized in real inches, so a download opens at its finished size. */
function wrap(width: number, height: number, title: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${fmt(width)}in" height="${fmt(height)}in" role="img"><title>${esc(title)}</title>${body}</svg>`;
}

export type RenderOptions = { seams?: boolean };

/** One block, drawn at its finished size. */
export function blockSvg(block: Block, size: number, colors: Record<string, string>, opts: RenderOptions = {}): string {
  const body = piecesMarkup(blockPieces(block), size / block.grid, colors, !!opts.seams, size);
  return wrap(size, size, `${block.name} quilt block`, body);
}

/** Quarter turns for the block at column `i`, row `j`. */
export function blockTurn(setting: Setting, i: number, j: number, cols: number, rows: number): number {
  if (setting === "alternate") return (i + j) % 2;
  if (setting === "quadrants") {
    const right = i >= cols / 2;
    const bottom = j >= rows / 2;
    if (right) return bottom ? 2 : 1;
    return bottom ? 3 : 0;
  }
  return 0;
}

function placed(markup: string, x: number, y: number, size: number, turns: number) {
  const rotate = turns ? ` rotate(${turns * 90} ${fmt(size / 2)} ${fmt(size / 2)})` : "";
  return `<g transform="translate(${fmt(x)} ${fmt(y)})${rotate}">${markup}</g>`;
}

function rectMarkup(x: number, y: number, w: number, h: number, color: string, span: number) {
  return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="${color}" stroke="${color}" stroke-width="${closeGap(span)}"/>`;
}

function gridBody(block: Block, state: PatternRequest, cols: number, rows: number, x0: number, y0: number, seams: boolean, wrapSash: boolean, span: number): string {
  const { size, sashing, colors, setting } = state;
  const inner = piecesMarkup(blockPieces(block), size / block.grid, colors, seams, span);
  const cell = size + sashing;
  let body = "";
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * cell;
      const y = y0 + j * cell;
      body += placed(inner, x, y, size, blockTurn(setting, i, j, cols, rows));
      if (sashing > 0) {
        if (wrapSash || i < cols - 1) body += rectMarkup(x + size, y, sashing, size, colors.sashing, span);
        if (wrapSash || j < rows - 1) body += rectMarkup(x, y + size, size, sashing, colors.sashing, span);
        if (wrapSash || (i < cols - 1 && j < rows - 1)) body += rectMarkup(x + size, y + size, sashing, sashing, colors.sashing, span);
      }
    }
  }
  return body;
}

/** The whole quilt top: blocks, sashing and border. */
export function quiltSvg(block: Block, state: PatternRequest, opts: RenderOptions = {}): string {
  const { width, height } = quiltSize(state);
  const { border, cols, rows, colors } = state;
  const ground = border > 0 ? rectMarkup(0, 0, width, height, colors.border, Math.max(width, height)) : "";
  const body = ground + gridBody(block, state, cols, rows, border, border, !!opts.seams, false, Math.max(width, height));
  return wrap(width, height, `${block.name} quilt layout`, body);
}

/**
 * A tile that repeats without a visible edge. Each block carries its sashing on
 * two sides, and a turned setting needs two blocks by two to complete a cycle.
 */
export function tileSvg(block: Block, state: PatternRequest, opts: RenderOptions = {}): string {
  const repeat = state.setting === "straight" ? 1 : 2;
  const side = repeat * (state.size + state.sashing);
  const body = gridBody(block, state, repeat, repeat, 0, 0, !!opts.seams, true, side);
  return wrap(side, side, `${block.name} seamless repeat`, body);
}
