import {
  appendBezierCurve,
  closePath,
  fill,
  LineCapStyle,
  LineJoinStyle,
  lineTo,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  setFillingColor,
  setLineCap,
  setLineJoin,
  setLineWidth,
  setStrokingColor,
  StandardFonts,
  stroke,
  type PDFOperator,
} from "pdf-lib";
import { Writer } from "./pdf";
import { buildMaze, CELL, generateMaze, MARKER_RADIUS, mazeText, routeWidth, type Maze, type MazePoint, type MazeRequest, type MazeWall } from "./maze";

const MARGIN = 36;
const CONTENT_W = 540;
const FOOT = 40;

function color(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

type Place = (p: MazePoint) => [number, number];

/** An arc as cubics no longer than a quarter turn, far closer than a printer can show. */
function arcOps(wall: Extract<MazeWall, { kind: "arc" }>, place: Place): PDFOperator[] {
  const steps = Math.ceil((wall.to - wall.from) / (Math.PI / 2) - 1e-9);
  const delta = (wall.to - wall.from) / steps;
  const k = (4 / 3) * Math.tan(delta / 4) * wall.radius;
  const [cx, cy] = wall.center;
  const at = (a: number): MazePoint => [cx + wall.radius * Math.cos(a), cy + wall.radius * Math.sin(a)];
  const ops: PDFOperator[] = [moveTo(...place(at(wall.from)))];
  for (let i = 0; i < steps; i++) {
    const a0 = wall.from + i * delta;
    const a1 = a0 + delta;
    const [x0, y0] = at(a0);
    const [x1, y1] = at(a1);
    const c1 = place([x0 - k * Math.sin(a0), y0 + k * Math.cos(a0)]);
    const c2 = place([x1 + k * Math.sin(a1), y1 - k * Math.cos(a1)]);
    ops.push(appendBezierCurve(...c1, ...c2, ...place([x1, y1])));
  }
  return ops;
}

/** The maze as operators in page space. `top` is the top edge of its box. */
export function mazeOps(maze: Maze, req: MazeRequest, x: number, top: number, scale: number, showSolution: boolean): PDFOperator[] {
  const { width, height, cells } = maze.graph;
  const place: Place = ([px, py]) => [x + px * scale, top - py * scale];
  const dot = (cell: number) => [...arcOps({ kind: "arc", center: [cells[cell].x, cells[cell].y], radius: MARKER_RADIUS, from: 0, to: 2 * Math.PI }, place), closePath()];
  const walls = maze.walls.flatMap((wall) => (wall.kind === "arc" ? arcOps(wall, place) : [moveTo(...place(wall.from)), lineTo(...place(wall.to))]));
  const route = showSolution
    ? [setLineWidth(routeWidth(req.weight) * scale), setStrokingColor(color(req.colors.accent)), moveTo(...place(maze.route[0])), ...maze.route.slice(1).map((p) => lineTo(...place(p))), stroke()]
    : [];
  return [
    pushGraphicsState(),
    setFillingColor(color(req.colors.background)),
    rectangle(x, top - height * scale, width * scale, height * scale),
    fill(),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    setLineWidth(((CELL * req.weight) / 100) * scale),
    setStrokingColor(color(req.colors.wall)),
    ...walls,
    stroke(),
    ...route,
    setFillingColor(color(req.colors.accent)),
    ...dot(maze.start),
    fill(),
    setStrokingColor(color(req.colors.accent)),
    setLineWidth(scale),
    ...dot(maze.exit),
    stroke(),
    popGraphicsState(),
  ];
}

/** Letter pages: the maze to solve, then a separate page with its solution. */
export async function generateMazePdf(request: MazeRequest): Promise<Uint8Array> {
  const locale = request.locale ?? "en";
  const result = generateMaze(request);
  const maze = buildMaze(request);
  const doc = await PDFDocument.create();
  const title = mazeText(locale, "pdfTitle");
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold, title);

  const draw = (showSolution: boolean) => {
    w.gap(8);
    const { width, height } = maze.graph;
    const scale = Math.min(CONTENT_W / width, (w.y - FOOT) / height);
    w.page.pushOperators(...mazeOps(maze, request, MARGIN + (CONTENT_W - width * scale) / 2, w.y, scale, showSolution));
  };

  w.text(title, { size: 22, bold: true });
  w.text(mazeText(locale, "pdfSub", { shape: result.shape, algorithm: result.algorithm, difficulty: result.difficulty, cells: result.cells }), { muted: true });
  w.text(mazeText(locale, "pdfSeed", { seed: request.seed }), { muted: true });
  w.text(mazeText(locale, "pdfHow"));
  draw(false);

  w.newPage();
  w.text(mazeText(locale, "pdfSolution"), { size: 16, bold: true });
  w.text(mazeText(locale, "pdfStats", { length: result.solutionLength, deadEnds: result.deadEnds }), { muted: true });
  draw(true);
  return doc.save();
}
