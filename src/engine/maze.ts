import type { Locale } from "./i18n";
import messages from "./messages/maze.json";

export const MAZE_SHAPES = ["square", "rectangle", "circle", "hexagon"] as const;
export type MazeShape = (typeof MAZE_SHAPES)[number];

export const MAZE_ALGORITHMS = ["backtracker", "prim", "kruskal", "wilson", "binaryTree"] as const;
export type MazeAlgorithm = (typeof MAZE_ALGORITHMS)[number];

export const MAZE_DIFFICULTIES = ["easy", "medium", "hard", "expert", "master", "extreme"] as const;
export type MazeDifficulty = (typeof MAZE_DIFFICULTIES)[number];

export type MazeColors = { background: string; wall: string; accent: string };

/** A maze's size. Cells across for any shape; `rows` is only for a rectangle. Without `cols`, the difficulty sets it. */
export type MazeSize = { cols?: number; rows?: number };

export type MazeRequest = MazeSize & {
  shape: MazeShape;
  algorithm: MazeAlgorithm;
  difficulty: MazeDifficulty;
  /** Wall width as a percent of a cell. */
  weight: number;
  /** The same seed and settings always give the same maze. */
  seed: number;
  colors: MazeColors;
  locale?: Locale;
};

export type MazeResult = {
  svg: { maze: string; solution: string };
  shape: string;
  algorithm: string;
  difficulty: string;
  cells: number;
  /** Cells on the path from start to exit, both included. */
  solutionLength: number;
  deadEnds: number;
  /** How wide a cell prints on each poster sheet, in inches. */
  posterCell: Record<MazePaperId, number>;
};

export type MazePoint = readonly [number, number];
/** A straight wall, or an arc running clockwise on screen from one angle to a larger one, in radians. */
export type MazeWall = { kind: "line"; from: MazePoint; to: MazePoint } | { kind: "arc"; center: MazePoint; radius: number; from: number; to: number };
export type MazeCell = { x: number; y: number; boundary: MazeWall[] };
/** Two cells that share a wall. `mid` is the middle of that wall, where a path crosses it. */
export type MazeEdge = { a: number; b: number; wall: MazeWall; mid: MazePoint };
export type MazeGraph = { width: number; height: number; cells: MazeCell[]; edges: MazeEdge[]; center?: number };

export type Maze = {
  graph: MazeGraph;
  /** Indexes into `graph.edges` of the walls removed. */
  passages: number[];
  start: number;
  exit: number;
  /** The outer walls left open. A circular maze ends at its center, so it has only the one. */
  openings: MazeWall[];
  /** Cells from start to exit. */
  solution: number[];
  /** The line drawn through those cells, from the opening at the start to the end. */
  route: MazePoint[];
  walls: MazeWall[];
};

/** A cell's side in drawing units, so wall weight in percent is a tenth of its width in units. */
export const CELL = 10;
/** Room around the maze: more than half the widest wall, so a wall's stroke stays on the canvas. */
export const MARGIN = 3;
/** Printed width of the SVG, in inches. */
const WIDTH_IN = 7.5;
const TALL = 1.3;
const ACROSS: Record<MazeDifficulty, number> = { easy: 10, medium: 16, hard: 24, expert: 36, master: 60, extreme: 100 };

export function mazeText(locale: Locale, key: keyof (typeof messages)["en"], values: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export const mazeAcross = (difficulty: MazeDifficulty) => ACROSS[difficulty];
/** A rectangle's rows when none are chosen. */
export const mazeTallRows = (cols: number) => Math.round(cols * TALL);

const POINTS_PER_INCH = 72;
const inches = (w: number, h: number) => ({ width: w * POINTS_PER_INCH, height: h * POINTS_PER_INCH });
const millimeters = (w: number, h: number) => inches(w / 25.4, h / 25.4);

/** Poster sheets, narrow side first, in points. */
export const MAZE_PAPERS = [
  { id: "ansiC", label: "ANSI C (17 × 22 in)", ...inches(17, 22) },
  { id: "ansiD", label: "ANSI D (22 × 34 in)", ...inches(22, 34) },
  { id: "ansiE", label: "ANSI E (34 × 44 in)", ...inches(34, 44) },
  { id: "a3", label: "A3 (297 × 420 mm)", ...millimeters(297, 420) },
  { id: "a2", label: "A2 (420 × 594 mm)", ...millimeters(420, 594) },
  { id: "a1", label: "A1 (594 × 841 mm)", ...millimeters(594, 841) },
  { id: "a0", label: "A0 (841 × 1189 mm)", ...millimeters(841, 1189) },
  { id: "2a0", label: "2A0 (1189 × 1682 mm)", ...millimeters(1189, 1682) },
  { id: "4a0", label: "4A0 (1682 × 2378 mm)", ...millimeters(1682, 2378) },
] as const;
export type MazePaperId = (typeof MAZE_PAPERS)[number]["id"];

/** Where a maze goes on a sheet, turned whichever way lets it print largest, under a short heading. */
export function posterLayout(width: number, height: number, paperId: MazePaperId) {
  const paper = MAZE_PAPERS.find((p) => p.id === paperId)!;
  const margin = paper.width * 0.04;
  const fontSize = paper.width / 45;
  const heading = fontSize * 3.2;
  const fit = (pageWidth: number, pageHeight: number) => Math.min((pageWidth - margin * 2) / width, (pageHeight - margin * 2 - heading) / height);
  const upright = fit(paper.width, paper.height);
  const turned = fit(paper.height, paper.width);
  const landscape = turned > upright;
  const scale = landscape ? turned : upright;
  const pageWidth = landscape ? paper.height : paper.width;
  const pageHeight = landscape ? paper.width : paper.height;
  return { pageWidth, pageHeight, margin, fontSize, scale, x: (pageWidth - width * scale) / 2, top: pageHeight - margin - heading };
}

/** A small seeded generator (mulberry32), so a seed means the same maze on every machine. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gridGraph(cols: number, rows: number): MazeGraph {
  const at = (c: number, r: number): MazePoint => [MARGIN + c * CELL, MARGIN + r * CELL];
  const line = (from: MazePoint, to: MazePoint): MazeWall => ({ kind: "line", from, to });
  const cells: MazeCell[] = [];
  const edges: MazeEdge[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y] = at(c, r);
      const boundary: MazeWall[] = [];
      if (r === 0) boundary.push(line(at(c, r), at(c + 1, r)));
      if (c === 0) boundary.push(line(at(c, r), at(c, r + 1)));
      if (r === rows - 1) boundary.push(line(at(c, r + 1), at(c + 1, r + 1)));
      if (c === cols - 1) boundary.push(line(at(c + 1, r), at(c + 1, r + 1)));
      cells.push({ x: x + CELL / 2, y: y + CELL / 2, boundary });
      const id = r * cols + c;
      if (c < cols - 1) edges.push({ a: id, b: id + 1, wall: line(at(c + 1, r), at(c + 1, r + 1)), mid: [x + CELL, y + CELL / 2] });
      if (r < rows - 1) edges.push({ a: id, b: id + cols, wall: line(at(c, r + 1), at(c + 1, r + 1)), mid: [x + CELL / 2, y + CELL] });
    }
  }
  return { width: cols * CELL + 2 * MARGIN, height: rows * CELL + 2 * MARGIN, cells, edges };
}

/** How many cells each ring has. A ring divides only once its cells would be twice as wide as they are deep. */
export function ringCounts(rings: number): number[] {
  const counts = [1];
  for (let ring = 1; ring < rings; ring++) {
    const previous = counts[ring - 1];
    counts.push(previous * Math.max(1, Math.floor((2 * Math.PI * ring) / previous)));
  }
  return counts;
}

/** A theta maze: one cell at the center, with rings of cells around it. */
function circleGraph(rings: number): MazeGraph {
  const c = MARGIN + rings * CELL;
  const center: MazePoint = [c, c];
  const counts = ringCounts(rings);
  const first = counts.map((_, ring) => counts.slice(0, ring).reduce((sum, n) => sum + n, 0));
  const angle = (ring: number, i: number) => -Math.PI / 2 + (2 * Math.PI * i) / counts[ring];
  const polar = (radius: number, a: number): MazePoint => [c + radius * Math.cos(a), c + radius * Math.sin(a)];
  const cells: MazeCell[] = [];
  const edges: MazeEdge[] = [];
  counts.forEach((count, ring) => {
    for (let i = 0; i < count; i++) {
      const id = first[ring] + i;
      const from = angle(ring, i);
      const to = angle(ring, i + 1);
      const [x, y] = ring === 0 ? center : polar((ring + 0.5) * CELL, (from + to) / 2);
      const outer = (ring + 1) * CELL;
      cells.push({ x, y, boundary: ring === rings - 1 ? [{ kind: "arc", center, radius: outer, from, to }] : [] });
      if (ring > 0) {
        edges.push({ a: id, b: first[ring] + ((i + 1) % count), wall: { kind: "line", from: polar(ring * CELL, to), to: polar(outer, to) }, mid: polar((ring + 0.5) * CELL, to) });
      }
      if (ring < rings - 1) {
        const split = counts[ring + 1] / count;
        for (let k = 0; k < split; k++) {
          const child = i * split + k;
          const a0 = angle(ring + 1, child);
          const a1 = angle(ring + 1, child + 1);
          edges.push({ a: id, b: first[ring + 1] + child, wall: { kind: "arc", center, radius: outer, from: a0, to: a1 }, mid: polar(outer, (a0 + a1) / 2) });
        }
      }
    }
  });
  const side = 2 * (rings * CELL + MARGIN);
  return { width: side, height: side, cells, edges, center: 0 };
}

/** A hexagon of pointy-topped hexagonal cells, in axial coordinates. */
function hexGraph(radius: number): MazeGraph {
  const s = CELL / Math.sqrt(3);
  const cellsWide = CELL * (2 * radius + 1);
  const cellsTall = s * (3 * radius + 2);
  const key = (q: number, r: number) => `${q},${r}`;
  const ids = new Map<string, number>();
  const places: [number, number][] = [];
  for (let r = -radius; r <= radius; r++) {
    for (let q = -radius; q <= radius; q++) {
      if (Math.abs(q + r) > radius) continue;
      ids.set(key(q, r), places.length);
      places.push([q, r]);
    }
  }
  // Clockwise from east. Side i runs between corners i and i + 1.
  const DIRECTIONS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
  const cells: MazeCell[] = [];
  const edges: MazeEdge[] = [];
  places.forEach(([q, r], id) => {
    const x = MARGIN + cellsWide / 2 + CELL * (q + r / 2);
    const y = MARGIN + cellsTall / 2 + 1.5 * s * r;
    const corner = (i: number): MazePoint => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return [x + s * Math.cos(a), y + s * Math.sin(a)];
    };
    const boundary: MazeWall[] = [];
    DIRECTIONS.forEach(([dq, dr], i) => {
      const wall: MazeWall = { kind: "line", from: corner(i), to: corner(i + 1) };
      const other = ids.get(key(q + dq, r + dr));
      if (other === undefined) boundary.push(wall);
      else if (other > id) {
        const [ax, ay] = corner(i);
        const [bx, by] = corner(i + 1);
        edges.push({ a: id, b: other, wall, mid: [(ax + bx) / 2, (ay + by) / 2] });
      }
    });
    cells.push({ x, y, boundary });
  });
  return { width: cellsWide + 2 * MARGIN, height: cellsTall + 2 * MARGIN, cells, edges };
}

/** The empty grid of a shape, `across` cells wide. */
export function mazeGraph(shape: MazeShape, across: number, down?: number): MazeGraph {
  if (shape === "square") return gridGraph(across, across);
  if (shape === "rectangle") return gridGraph(across, down ?? Math.round(across * TALL));
  if (shape === "circle") return circleGraph(Math.round(across / 2));
  return hexGraph(Math.floor(across / 2));
}

type Link = { cell: number; edge: number };

function linksOf(graph: MazeGraph): Link[][] {
  const links: Link[][] = graph.cells.map(() => []);
  graph.edges.forEach(({ a, b }, edge) => {
    links[a].push({ cell: b, edge });
    links[b].push({ cell: a, edge });
  });
  return links;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const pickOne = <T,>(items: T[], random: () => number): T => items[Math.floor(random() * items.length)];

/** Walks as far as it can, and backs up only at a dead end: long, winding corridors. */
function backtracker(links: Link[][], random: () => number): number[] {
  const seen = links.map(() => false);
  const first = Math.floor(random() * links.length);
  const stack = [first];
  seen[first] = true;
  const out: number[] = [];
  while (stack.length) {
    const here = stack[stack.length - 1];
    const open = links[here].filter((l) => !seen[l.cell]);
    if (!open.length) {
      stack.pop();
      continue;
    }
    const next = pickOne(open, random);
    seen[next.cell] = true;
    out.push(next.edge);
    stack.push(next.cell);
  }
  return out;
}

/** Grows outward from one cell, joining a random cell on its edge each time: many short dead ends. */
function prim(links: Link[][], random: () => number): number[] {
  const seen = links.map(() => false);
  const queued = links.map(() => false);
  const frontier: number[] = [];
  const out: number[] = [];
  const visit = (cell: number) => {
    seen[cell] = true;
    for (const { cell: other } of links[cell]) {
      if (!seen[other] && !queued[other]) {
        queued[other] = true;
        frontier.push(other);
      }
    }
  };
  visit(Math.floor(random() * links.length));
  while (frontier.length) {
    const i = Math.floor(random() * frontier.length);
    const cell = frontier[i];
    frontier[i] = frontier[frontier.length - 1];
    frontier.pop();
    out.push(pickOne(links[cell].filter((l) => seen[l.cell]), random).edge);
    visit(cell);
  }
  return out;
}

/** Removes walls in random order, unless the two sides are already joined. */
function kruskal(graph: MazeGraph, random: () => number): number[] {
  const parent = graph.cells.map((_, i) => i);
  const find = (cell: number): number => {
    let root = cell;
    while (parent[root] !== root) root = parent[root];
    while (parent[cell] !== root) {
      const up = parent[cell];
      parent[cell] = root;
      cell = up;
    }
    return root;
  };
  const out: number[] = [];
  for (const edge of shuffled(graph.edges.map((_, i) => i), random)) {
    const a = find(graph.edges[edge].a);
    const b = find(graph.edges[edge].b);
    if (a !== b) {
      parent[a] = b;
      out.push(edge);
    }
  }
  return out;
}

/** Loop-erased random walks: every possible maze on the grid is equally likely. */
function wilson(links: Link[][], random: () => number): number[] {
  const inTree = links.map(() => false);
  const order = shuffled(links.map((_, i) => i), random);
  inTree[order[0]] = true;
  const next: (Link | undefined)[] = links.map(() => undefined);
  const out: number[] = [];
  for (const start of order) {
    if (inTree[start]) continue;
    // Keeping only each cell's latest step erases the walk's loops.
    let cell = start;
    while (!inTree[cell]) {
      const step = pickOne(links[cell], random);
      next[cell] = step;
      cell = step.cell;
    }
    cell = start;
    while (!inTree[cell]) {
      inTree[cell] = true;
      const step = next[cell] as Link;
      out.push(step.edge);
      cell = step.cell;
    }
  }
  return out;
}

/** Each cell joins one neighbor that comes before it in reading order: a strong diagonal lean. */
function binaryTree(links: Link[][], random: () => number): number[] {
  return links.flatMap((own, cell) => {
    const earlier = own.filter((l) => l.cell < cell);
    return earlier.length ? [pickOne(earlier, random).edge] : [];
  });
}

/** Chooses which walls to remove. Every algorithm returns a spanning tree of the grid. */
export function carve(graph: MazeGraph, algorithm: MazeAlgorithm, random: () => number): number[] {
  if (algorithm === "kruskal") return kruskal(graph, random);
  const links = linksOf(graph);
  if (algorithm === "backtracker") return backtracker(links, random);
  if (algorithm === "prim") return prim(links, random);
  if (algorithm === "wilson") return wilson(links, random);
  return binaryTree(links, random);
}

export function wallMiddle(wall: MazeWall): MazePoint {
  if (wall.kind === "line") return [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2];
  const a = (wall.from + wall.to) / 2;
  return [wall.center[0] + wall.radius * Math.cos(a), wall.center[1] + wall.radius * Math.sin(a)];
}

/** Steps from a cell along the passages, with the passage that led to each cell. */
function walk(links: Link[][], from: number) {
  const distance = links.map(() => -1);
  const via: (Link | undefined)[] = links.map(() => undefined);
  distance[from] = 0;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const link of links[queue[i]]) {
      if (distance[link.cell] >= 0) continue;
      distance[link.cell] = distance[queue[i]] + 1;
      via[link.cell] = { cell: queue[i], edge: link.edge };
      queue.push(link.cell);
    }
  }
  return { distance, via };
}

const farthest = (distance: number[], among: number[]) => among.reduce((best, cell) => (distance[cell] > distance[best] ? cell : best), among[0]);

/** The whole maze: its grid, passages, ends and solution. */
export function buildMaze(req: Pick<MazeRequest, "shape" | "algorithm" | "difficulty" | "seed" | "cols" | "rows">): Maze {
  const graph = mazeGraph(req.shape, req.cols ?? ACROSS[req.difficulty], req.rows);
  const passages = carve(graph, req.algorithm, seededRandom(req.seed));
  const links: Link[][] = graph.cells.map(() => []);
  for (const edge of passages) {
    const { a, b } = graph.edges[edge];
    links[a].push({ cell: b, edge });
    links[b].push({ cell: a, edge });
  }
  const outer = graph.cells.flatMap((cell, i) => (cell.boundary.length ? [i] : []));
  // The two outer cells farthest apart, or for a circle the outer cell farthest from the center.
  const start = farthest(walk(links, graph.center ?? outer[0]).distance, outer);
  const { distance, via } = walk(links, start);
  const exit = graph.center ?? farthest(distance, outer);

  const solution = [exit];
  const crossings: MazePoint[] = [];
  for (let step = via[exit]; step; step = via[step.cell]) {
    solution.unshift(step.cell);
    crossings.unshift(graph.edges[step.edge].mid);
  }
  const openings = [graph.cells[start].boundary[0], ...(graph.center === undefined ? [graph.cells[exit].boundary[0]] : [])];
  const route: MazePoint[] = [wallMiddle(openings[0])];
  solution.forEach((cell, i) => {
    route.push([graph.cells[cell].x, graph.cells[cell].y]);
    if (i < crossings.length) route.push(crossings[i]);
  });
  if (openings[1]) route.push(wallMiddle(openings[1]));

  const open = new Set(passages);
  const inner = graph.edges.flatMap((edge, i) => (open.has(i) ? [] : [edge.wall]));
  const rim = graph.cells.flatMap((cell) => cell.boundary).filter((wall) => !openings.includes(wall));
  return { graph, passages, start, exit, openings, solution, route, walls: [...inner, ...rim] };
}

const coord = (n: number) => Number(n.toFixed(3));

function wallPath(wall: MazeWall): string {
  if (wall.kind === "line") return `M${coord(wall.from[0])} ${coord(wall.from[1])}L${coord(wall.to[0])} ${coord(wall.to[1])}`;
  const [cx, cy] = wall.center;
  const at = (a: number) => `${coord(cx + wall.radius * Math.cos(a))} ${coord(cy + wall.radius * Math.sin(a))}`;
  return `M${at(wall.from)}A${coord(wall.radius)} ${coord(wall.radius)} 0 0 1 ${at(wall.to)}`;
}

/** Easy to see, and never more than half the corridor the walls leave. */
export const routeWidth = (weight: number) => Math.min(2.2, (CELL * (1 - weight / 100)) / 2);
export const MARKER_RADIUS = 2.2;

function mazeSvg(maze: Maze, req: MazeRequest, title: string, showSolution: boolean): string {
  const { width, height, cells } = maze.graph;
  const w = coord(width);
  const h = coord(height);
  const { background, wall, accent } = req.colors;
  const route = showSolution
    ? `<path data-solution="1" fill="none" stroke="${accent}" stroke-width="${coord(routeWidth(req.weight))}" stroke-linecap="round" stroke-linejoin="round" d="M${maze.route.map(([x, y]) => `${coord(x)} ${coord(y)}`).join("L")}"/>`
    : "";
  const a = cells[maze.start];
  const b = cells[maze.exit];
  const markers = `<circle data-mark="start" cx="${coord(a.x)}" cy="${coord(a.y)}" r="${MARKER_RADIUS}" fill="${accent}"/><circle data-mark="exit" cx="${coord(b.x)}" cy="${coord(b.y)}" r="${MARKER_RADIUS}" fill="${background}" stroke="${accent}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${WIDTH_IN}in" height="${coord((WIDTH_IN * height) / width)}in" role="img"><title>${title}</title><rect width="${w}" height="${h}" fill="${background}"/><path data-walls="1" fill="none" stroke="${wall}" stroke-width="${coord((CELL * req.weight) / 100)}" stroke-linecap="round" stroke-linejoin="round" d="${maze.walls.map(wallPath).join("")}"/>${route}${markers}</svg>`;
}

export function generateMaze(req: MazeRequest): MazeResult {
  const locale = req.locale ?? "en";
  const maze = buildMaze(req);
  const degree = maze.graph.cells.map(() => 0);
  for (const edge of maze.passages) {
    degree[maze.graph.edges[edge].a]++;
    degree[maze.graph.edges[edge].b]++;
  }
  return {
    svg: { maze: mazeSvg(maze, req, mazeText(locale, "svgMaze"), false), solution: mazeSvg(maze, req, mazeText(locale, "svgSolution"), true) },
    shape: mazeText(locale, `shape_${req.shape}`),
    algorithm: mazeText(locale, `algorithm_${req.algorithm}`),
    difficulty: mazeText(locale, req.cols === undefined ? `difficulty_${req.difficulty}` : "difficulty_custom"),
    cells: maze.graph.cells.length,
    solutionLength: maze.solution.length,
    deadEnds: degree.filter((d) => d === 1).length,
    posterCell: Object.fromEntries(MAZE_PAPERS.map((paper) => [paper.id, Number(((posterLayout(maze.graph.width, maze.graph.height, paper.id).scale * CELL) / POINTS_PER_INCH).toFixed(3))])) as Record<MazePaperId, number>,
  };
}
