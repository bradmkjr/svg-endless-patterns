import { inflateSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, PDFArray, PDFName, PDFRawStream, StandardFonts } from "pdf-lib";
import uiCopy from "../i18n/messages/maze.json";
import { ALGORITHM_OPTIONS, defaultMazeState, DIFFICULTY_OPTIONS, parseMazeState, rememberMazeSeed, serializeMazeState, SHAPE_OPTIONS, storedMazeSeed, WEIGHT_OPTIONS } from "../lib/mazeState";
import engineCopy from "./messages/maze.json";
import { buildMaze, carve, CELL, generateMaze, MAZE_ALGORITHMS, MAZE_DIFFICULTIES, MAZE_SHAPES, mazeAcross, mazeGraph, ringCounts, routeWidth, seededRandom, wallMiddle, type Maze, type MazePoint, type MazeRequest, type MazeWall } from "./maze";
import { generateMazePdf } from "./mazePdf";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const COMBOS = MAZE_SHAPES.flatMap((shape) => MAZE_ALGORITHMS.map((algorithm) => [shape, algorithm] as const));
const req: MazeRequest = { shape: "square", algorithm: "backtracker", difficulty: "easy", weight: 15, seed: 42, colors: { background: "#ffffff", wall: "#111111", accent: "#cc0000" } };

/** Follows only the passages, without trusting the generator's own bookkeeping. */
function reachable(maze: Maze, from: number) {
  const next: number[][] = maze.graph.cells.map(() => []);
  for (const e of maze.passages) {
    next[maze.graph.edges[e].a].push(maze.graph.edges[e].b);
    next[maze.graph.edges[e].b].push(maze.graph.edges[e].a);
  }
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    for (const c of next[queue.pop()!]) {
      if (seen.has(c)) continue;
      seen.add(c);
      queue.push(c);
    }
  }
  return { seen, next };
}

function expectPerfect(maze: Maze) {
  const n = maze.graph.cells.length;
  // A connected graph with n - 1 edges is a tree: no cycles, and exactly one path between any two cells.
  expect(maze.passages).toHaveLength(n - 1);
  expect(new Set(maze.passages).size).toBe(n - 1);
  expect(reachable(maze, 0).seen.size).toBe(n);
}

function expectSolved(maze: Maze) {
  const { graph, solution, start, exit, passages } = maze;
  expect(solution[0]).toBe(start);
  expect(solution[solution.length - 1]).toBe(exit);
  expect(start).not.toBe(exit);
  expect(new Set(solution).size).toBe(solution.length);
  const open = new Set(passages.map((e) => [graph.edges[e].a, graph.edges[e].b].sort((a, b) => a - b).join()));
  for (let i = 1; i < solution.length; i++) expect(open.has([solution[i - 1], solution[i]].sort((a, b) => a - b).join())).toBe(true);
}

/** A wall as straight pieces, close enough to test crossings. */
function pieces(wall: MazeWall): [MazePoint, MazePoint][] {
  if (wall.kind === "line") return [[wall.from, wall.to]];
  const points = Array.from({ length: 13 }, (_, i): MazePoint => {
    const a = wall.from + ((wall.to - wall.from) * i) / 12;
    return [wall.center[0] + wall.radius * Math.cos(a), wall.center[1] + wall.radius * Math.sin(a)];
  });
  return points.slice(1).map((p, i) => [points[i], p]);
}

function crosses(a: MazePoint, b: MazePoint, c: MazePoint, d: MazePoint): boolean {
  const cross = (p: MazePoint, q: MazePoint, r: MazePoint) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  // Boxes first, since two segments on one line, apart, pass both of the side tests.
  const apart = (axis: 0 | 1) => Math.max(a[axis], b[axis]) < Math.min(c[axis], d[axis]) - 1e-6 || Math.max(c[axis], d[axis]) < Math.min(a[axis], b[axis]) - 1e-6;
  if (apart(0) || apart(1)) return false;
  return d1 * d2 < 1e-6 && d3 * d4 < 1e-6;
}

const blocked = (a: MazePoint, b: MazePoint, walls: [MazePoint, MazePoint][]) => walls.some(([c, d]) => crosses(a, b, c, d));

describe("perfect mazes", () => {
  it.each(COMBOS)("%s, %s: spanning tree with a valid solution, over many seeds and every difficulty", (shape, algorithm) => {
    for (const difficulty of MAZE_DIFFICULTIES) {
      for (let seed = 0; seed < (difficulty === "expert" ? 8 : 40); seed++) {
        const maze = buildMaze({ shape, algorithm, difficulty, seed });
        expectPerfect(maze);
        expectSolved(maze);
      }
    }
  });

  it("the check above catches a loop and a cut-off cell", () => {
    const maze = buildMaze({ ...req });
    const extra = maze.graph.edges.findIndex((_, i) => !maze.passages.includes(i));
    expect(() => expectPerfect({ ...maze, passages: [...maze.passages, extra] })).toThrow();
    expect(() => expectPerfect({ ...maze, passages: maze.passages.slice(1) })).toThrow();
    expect(() => expectPerfect({ ...maze, passages: [...maze.passages.slice(1), extra] })).toThrow();
  });
});

describe("drawn walls", () => {
  // The walls are read as geometry: this checks what prints, not the list of passages.
  it.each(COMBOS)("%s, %s: a wall stands between two cells exactly when there's no passage", (shape, algorithm) => {
    for (const seed of [1, 2]) {
      const maze = buildMaze({ shape, algorithm, difficulty: "easy", seed });
      const walls = maze.walls.flatMap(pieces);
      const open = new Set(maze.passages);
      maze.graph.edges.forEach((edge, i) => {
        const a = maze.graph.cells[edge.a];
        const b = maze.graph.cells[edge.b];
        const here: MazePoint = [a.x, a.y];
        const there: MazePoint = [b.x, b.y];
        const stopped = blocked(here, edge.mid, walls) || blocked(edge.mid, there, walls);
        expect(stopped).toBe(!open.has(i));
      });
    }
  });

  it.each(COMBOS)("%s, %s: the solution line crosses no wall, and the rim is closed except for the openings", (shape, algorithm) => {
    for (const seed of [3, 4]) {
      const maze = buildMaze({ shape, algorithm, difficulty: "easy", seed });
      const walls = maze.walls.flatMap(pieces);
      // Its first and last points sit in the openings.
      for (let i = 1; i < maze.route.length; i++) expect(blocked(maze.route[i - 1], maze.route[i], walls)).toBe(false);
      const rim = maze.graph.cells.flatMap((c) => c.boundary);
      const left = rim.filter((w) => !maze.openings.includes(w));
      for (const wall of left) expect(maze.walls).toContain(wall);
      expect(maze.walls).toHaveLength(maze.graph.edges.length - maze.passages.length + left.length);
      expect(maze.openings).toHaveLength(shape === "circle" ? 1 : 2);
      for (const opening of maze.openings) expect(maze.walls).not.toContain(opening);
      expect(maze.route[0]).toEqual(wallMiddle(maze.openings[0]));
    }
  });

  it("a circular maze ends at its center, and the others end on the rim", () => {
    const circle = buildMaze({ ...req, shape: "circle" });
    expect(circle.exit).toBe(circle.graph.center);
    for (const shape of ["square", "rectangle", "hexagon"] as const) {
      const maze = buildMaze({ ...req, shape });
      expect(maze.graph.cells[maze.start].boundary.length).toBeGreaterThan(0);
      expect(maze.graph.cells[maze.exit].boundary.length).toBeGreaterThan(0);
    }
  });
});

describe("grids", () => {
  it("each cell's neighbors really are next to it", () => {
    for (const shape of MAZE_SHAPES) {
      const graph = mazeGraph(shape, 16);
      for (const { a, b, mid } of graph.edges) {
        expect(Math.hypot(graph.cells[a].x - graph.cells[b].x, graph.cells[a].y - graph.cells[b].y)).toBeLessThan(CELL * 2.2); // A ring's cells can reach two cells wide.
        expect(Math.hypot(graph.cells[a].x - mid[0], graph.cells[a].y - mid[1])).toBeLessThanOrEqual(CELL + 1e-9);
      }
    }
  });

  it("has the expected cells and neighbors", () => {
    expect(mazeGraph("square", 10).cells).toHaveLength(100);
    expect(mazeGraph("rectangle", 10).cells).toHaveLength(130);
    expect(mazeGraph("hexagon", 10).cells).toHaveLength(91); // 3r(r + 1) + 1, for r = 5
    expect(mazeGraph("square", 10).edges).toHaveLength(180);
    const hex = mazeGraph("hexagon", 10);
    const degree = hex.cells.map(() => 0);
    for (const { a, b } of hex.edges) {
      degree[a]++;
      degree[b]++;
    }
    expect(degree.filter((d) => d === 6)).toHaveLength(61); // Every cell off the outer ring.
    expect(degree.filter((d) => d === 3)).toHaveLength(6); // The six corners.
  });

  it("keeps a ring's cells at least one cell wide at their inner edge", () => {
    const counts = ringCounts(18);
    expect(counts.slice(0, 3)).toEqual([1, 6, 12]);
    counts.forEach((count, ring) => {
      if (ring > 0) {
        expect((2 * Math.PI * ring) / count).toBeGreaterThanOrEqual(1);
        expect(count % counts[ring - 1]).toBe(0);
      }
    });
    expect(mazeGraph("circle", 10).cells).toHaveLength(counts.slice(0, 5).reduce((a, b) => a + b, 0));
  });
});

describe("algorithms", () => {
  const stats = (shape: MazeRequest["shape"], algorithm: MazeRequest["algorithm"]) => {
    const runs = Array.from({ length: 12 }, (_, seed) => generateMaze({ ...req, shape, algorithm, difficulty: "hard", seed }));
    return { deadEnds: runs.reduce((sum, r) => sum + r.deadEnds, 0) / runs.length / runs[0].cells, path: runs.reduce((sum, r) => sum + r.solutionLength, 0) / runs.length / runs[0].cells };
  };

  it.each(MAZE_SHAPES)("%s: have measurably different textures", (shape) => {
    const backtracker = stats(shape, "backtracker");
    const prim = stats(shape, "prim");
    // A depth-first walk has about 10% dead ends, and Prim's about 30%.
    expect(backtracker.deadEnds).toBeLessThan(0.2);
    expect(prim.deadEnds).toBeGreaterThan(0.2);
    expect(backtracker.path).toBeGreaterThan(prim.path * 2);
  });

  it("backtracker, Kruskal and Wilson differ, and binary tree has its open sides", () => {
    expect(stats("square", "backtracker").path).toBeGreaterThan(stats("square", "kruskal").path);
    const graph = mazeGraph("square", 8);
    for (let seed = 0; seed < 10; seed++) {
      const open = new Set(carve(graph, "binaryTree", seededRandom(seed)).map((e) => `${graph.edges[e].a}-${graph.edges[e].b}`));
      for (let i = 0; i < 7; i++) {
        expect(open.has(`${i}-${i + 1}`)).toBe(true); // Along the top.
        expect(open.has(`${i * 8}-${(i + 1) * 8}`)).toBe(true); // Down the left.
      }
    }
  });

  it("Wilson's algorithm draws each spanning tree of a small grid equally often", () => {
    // A 2 x 2 grid has four spanning trees, one for each wall left standing.
    const graph = mazeGraph("square", 2);
    const random = seededRandom(1);
    const counts = new Map<string, number>();
    const runs = 8000;
    for (let i = 0; i < runs; i++) {
      const key = [...carve(graph, "wilson", random)].sort().join();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(4);
    for (const count of counts.values()) expect(Math.abs(count / runs - 0.25)).toBeLessThan(0.025);
  });

  it("gets harder with difficulty", () => {
    let cells = 0;
    for (const difficulty of MAZE_DIFFICULTIES) {
      const result = generateMaze({ ...req, difficulty });
      expect(result.cells).toBeGreaterThan(cells);
      cells = result.cells;
    }
    expect(mazeAcross("expert")).toBeGreaterThan(mazeAcross("easy"));
  });
});

describe("seeds", () => {
  it.each(COMBOS)("%s, %s: the same seed gives the same files, and other seeds differ", (shape, algorithm) => {
    const a = generateMaze({ ...req, shape, algorithm });
    expect(generateMaze({ ...req, shape, algorithm })).toEqual(a);
    expect(new Set(Array.from({ length: 12 }, (_, seed) => generateMaze({ ...req, shape, algorithm, seed: seed + 100 }).svg.maze)).size).toBe(12);
  });

  it("is pinned to a known maze, so a seed keeps its meaning across releases", () => {
    const { passages, start, exit } = buildMaze({ shape: "square", algorithm: "kruskal", difficulty: "easy", seed: 1 });
    expect(passages.slice(0, 3).concat(start, exit)).toEqual(PINNED);
  });
});

const PINNED = [19, 90, 163, 95, 93];

describe("output", () => {
  const numbers = (d: string) => [...d.matchAll(/([MLA])([^MLA]*)/g)].flatMap(([, cmd, raw]) => {
    const n = raw.trim().split(/\s+/).map(Number);
    return cmd === "A" ? [[n[5], n[6]]] : [[n[0], n[1]]];
  });

  it.each(COMBOS)("%s, %s: nothing leaves the canvas, at any weight or difficulty", (shape, algorithm) => {
    for (const difficulty of MAZE_DIFFICULTIES) {
      for (const weight of WEIGHT_OPTIONS) {
        const { svg } = generateMaze({ ...req, shape, algorithm, difficulty, weight });
        for (const file of [svg.maze, svg.solution]) {
          const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(file)!.map(Number);
          for (const [, width, d] of file.matchAll(/stroke-width="([\d.]+)"[^>]* d="([^"]+)"/g)) {
            const reach = Number(width) / 2;
            for (const [x, y] of numbers(d)) {
              expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
              expect(x - reach).toBeGreaterThanOrEqual(0);
              expect(y - reach).toBeGreaterThanOrEqual(0);
              expect(x + reach).toBeLessThanOrEqual(w);
              expect(y + reach).toBeLessThanOrEqual(h);
            }
          }
          for (const [, cx, cy, r] of file.matchAll(/cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)) {
            expect(Number(cx) - Number(r)).toBeGreaterThanOrEqual(0);
            expect(Number(cy) - Number(r)).toBeGreaterThanOrEqual(0);
            expect(Number(cx) + Number(r)).toBeLessThanOrEqual(w);
            expect(Number(cy) + Number(r)).toBeLessThanOrEqual(h);
          }
        }
      }
    }
  });

  it("draws the solution only in the solution file", () => {
    const { svg } = generateMaze(req);
    expect(svg.maze).not.toContain("data-solution");
    expect(svg.solution).toContain("data-solution");
    expect(svg.maze.replace("Maze", "")).toBe(svg.solution.replace(/<path data-solution[^>]*>/, "").replace("Maze with its solution", ""));
  });

  it("leaves room for the solution at the heaviest wall", () => {
    for (const weight of WEIGHT_OPTIONS) expect(routeWidth(weight)).toBeLessThanOrEqual((CELL * (1 - weight / 100)) / 2);
  });

  it("sets the wall weight and colors, in the form PNG export expects", () => {
    const { svg } = generateMaze({ ...req, weight: 30, colors: { background: "#010203", wall: "#a0b0c0", accent: "#ffeedd" } });
    expect(svg.maze).toMatch(/fill="#010203"/);
    expect(svg.maze).toMatch(/stroke="#a0b0c0" stroke-width="3"/);
    expect(svg.solution).toMatch(/stroke="#ffeedd"/);
    expect(svg.maze).toMatch(/width="[\d.]+in" height="[\d.]+in"/);
    expect(svg.maze).toMatch(/viewBox="0 0 [\d.]+ [\d.]+"/);
  });

  it.each(LOCALES)("builds a %s PDF for every shape and difficulty", async (locale) => {
    for (const shape of MAZE_SHAPES) {
      for (const difficulty of ["easy", "expert"] as const) {
        const doc = await PDFDocument.load(await generateMazePdf({ ...defaultMazeState(locale), shape, difficulty }));
        expect(doc.getPageCount()).toBe(2);
      }
    }
  });

  it("puts the solution on the second page only", async () => {
    // Accent-colored strokes set a line width first; only the solution uses this one.
    const doc = await PDFDocument.load(await generateMazePdf({ ...req, difficulty: "easy" }));
    const content = (page: number) => {
      const contents = doc.getPage(page).node.get(PDFName.of("Contents"));
      const streams = contents instanceof PDFArray ? contents.asArray() : [contents];
      return streams
        .map((ref) => doc.context.lookup(ref) as PDFRawStream)
        .map((stream) => inflateSync(stream.getContents()).toString("latin1"))
        .join("\n");
    };
    const lines = (text: string) => (text.match(/\nl\n|\sl\n/g) ?? []).length;
    expect(lines(content(1))).toBeGreaterThan(lines(content(0)));
    expect(lines(content(1)) - lines(content(0))).toBe(buildMaze(req).route.length - 1);
  });

  it("all PDF text can be set in Helvetica", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const locale of LOCALES) for (const value of Object.values(engineCopy[locale])) expect(() => font.encodeText(value)).not.toThrow();
  });
});

describe("share links", () => {
  const full: MazeRequest = { shape: "hexagon", algorithm: "wilson", difficulty: "expert", weight: 40, seed: defaultMazeState().seed, colors: { background: "#010203", wall: "#a0b0c0", accent: "#ffeedd" } };

  it("keeps the options in step with the engine", () => {
    expect(SHAPE_OPTIONS).toEqual([...MAZE_SHAPES]);
    expect(ALGORITHM_OPTIONS).toEqual([...MAZE_ALGORITHMS]);
    expect(DIFFICULTY_OPTIONS).toEqual([...MAZE_DIFFICULTIES]);
  });

  it.each(LOCALES)("round trips in %s, and leaves out defaults", (locale) => {
    expect(serializeMazeState(defaultMazeState(locale))).toBe("");
    const state = { ...full, ...(locale === "en" ? {} : { locale }) };
    expect(parseMazeState(new URLSearchParams(serializeMazeState(state)), locale)).toEqual(state);
  });

  it("round trips every single option", () => {
    const base = defaultMazeState();
    const each: Partial<MazeRequest>[] = [...SHAPE_OPTIONS.map((shape) => ({ shape })), ...ALGORITHM_OPTIONS.map((algorithm) => ({ algorithm })), ...DIFFICULTY_OPTIONS.map((difficulty) => ({ difficulty })), ...WEIGHT_OPTIONS.map((weight) => ({ weight }))];
    for (const patch of each) expect(parseMazeState(new URLSearchParams(serializeMazeState({ ...base, ...patch })))).toEqual({ ...base, ...patch });
  });

  it("never puts a seed in a link, and ignores one that's there", () => {
    const base = defaultMazeState();
    expect(serializeMazeState({ ...base, seed: 12345 })).toBe("");
    expect(parseMazeState(new URLSearchParams("seed=12345"))).toEqual(base);
  });

  it("falls back on bad input, one setting at a time", () => {
    const base = defaultMazeState();
    expect(parseMazeState(new URLSearchParams("shape=star&a=magic&d=impossible&w=999&seed=-3&bg=red&ln=12345&ac=gggggg"))).toEqual(base);
    expect(parseMazeState(new URLSearchParams("shape=circle%00&w=abc&a=__proto__&d=constructor"))).toEqual(base);
    const partial = parseMazeState(new URLSearchParams("shape=circle&w=999"));
    expect(partial.shape).toBe("circle");
    expect(partial.weight).toBe(base.weight);
  });

  it("uses the same design in every language", () => {
    const design = (locale: (typeof LOCALES)[number]) => {
      const { locale: _, colors, ...rest } = defaultMazeState(locale);
      void _;
      return { ...rest, background: colors.background, wall: colors.wall };
    };
    for (const locale of LOCALES) expect(design(locale)).toEqual(design("en"));
  });
});

describe("remembered seed", () => {
  afterEach(() => vi.unstubAllGlobals());

  const storage = () => {
    const items = new Map<string, string>();
    return { items, getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v) };
  };

  it("keeps the seed per tool, under its own key", () => {
    const localStorage = storage();
    vi.stubGlobal("window", { localStorage });
    expect(storedMazeSeed()).toBeUndefined();
    rememberMazeSeed(4321);
    expect(localStorage.items.get("endless-patterns:seed:maze")).toBe("4321");
    expect(storedMazeSeed()).toEqual({ seed: 4321 });
  });

  it("ignores a bad stored value", () => {
    const localStorage = storage();
    localStorage.items.set("endless-patterns:seed:maze", "banana");
    vi.stubGlobal("window", { localStorage });
    expect(storedMazeSeed()).toBeUndefined();
  });

  it("carries on without storage", () => {
    const thrower = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("window", { localStorage: { getItem: thrower, setItem: thrower } });
    expect(() => rememberMazeSeed(1)).not.toThrow();
    expect(storedMazeSeed()).toBeUndefined();
    vi.unstubAllGlobals();
    expect(() => rememberMazeSeed(1)).not.toThrow();
    expect(storedMazeSeed()).toBeUndefined();
  });
});

describe("translations", () => {
  const leaves = (value: unknown, path = ""): [string, string][] =>
    typeof value === "string" ? [[path, value]] : Object.entries(value as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  const holes = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();

  it.each([["engine", engineCopy], ["site", uiCopy]] as const)("%s text has the same keys and placeholders in every language", (_, copy) => {
    const english = Object.fromEntries(leaves(copy.en));
    for (const locale of LOCALES) {
      const here = Object.fromEntries(leaves(copy[locale]));
      expect(Object.keys(here).sort()).toEqual(Object.keys(english).sort());
      for (const [key, text] of Object.entries(here)) {
        expect(text.trim()).not.toBe("");
        expect(holes(text)).toEqual(holes(english[key]));
      }
    }
  });

  it("has every option's label", () => {
    for (const locale of LOCALES) {
      for (const id of SHAPE_OPTIONS) expect(uiCopy[locale].shapes[id]).toBe(engineCopy[locale][`shape_${id}`]);
      for (const id of ALGORITHM_OPTIONS) expect(uiCopy[locale].algorithms[id]).toBe(engineCopy[locale][`algorithm_${id}`]);
      for (const id of DIFFICULTY_OPTIONS) expect(uiCopy[locale].difficulties[id]).toBe(engineCopy[locale][`difficulty_${id}`]);
    }
  });
});
