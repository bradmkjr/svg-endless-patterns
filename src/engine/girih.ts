import { approxInches, inches } from "./format";
import type { Locale } from "./i18n";
import text from "./messages/girih.json";
import { applyAffine, symmetryElements, tileSymmetries, wallpaperGroup, type Affine, type Vec, type WallpaperGroup } from "./wallpaper";

/**
 * Geometric stars and girih, all drawn the same way. Every tile gets strapwork: from
 * each edge's midpoint two lines leave at a fixed angle to the edge. Lines from
 * neighboring edges meet inside the tile, so they close into a star. The same angle on
 * both sides of an edge makes each line run straight on into the next tile.
 *
 * Option 10 is true girih: the five tiles, edge to edge, at 54 degrees to the edge, so
 * lines cross at each midpoint at 72 and 108 degrees. The others are star patterns on
 * regular polygons. 8, 10 and 12-fold stars can't give a whole repeating pattern that
 * symmetry, so each option reports the star's order and the pattern's order separately.
 */

export const GIRIH_SYMMETRIES = [4, 6, 8, 10, 12] as const;
export type GirihSymmetry = (typeof GIRIH_SYMMETRIES)[number];
export const GIRIH_STARS = ["star", "sharp", "rosette"] as const;
export type GirihStar = (typeof GIRIH_STARS)[number];
export type GirihColors = { background: string; primary: string; accent: string; line: string };

export type GirihRequest = {
  symmetry: GirihSymmetry;
  star: GirihStar;
  /** Width of the lines, as a percent of a girih edge or the same scale on other options. */
  lineWeight: number;
  colors: GirihColors;
  /** Draw the edges of the tiles under the lines. */
  showTiles: boolean;
  /** Width of one repeat, in inches. Its height follows from the pattern. */
  repeatWidth: number;
  /** Repeats in the wall panel. */
  across: number;
  down: number;
  locale?: Locale;
};

export type GirihPart = { id: string; name: string; count: number };

export type GirihResult = {
  svg: { repeat: string; panel: string; stencil: string };
  /** True only for the five-tile patch. */
  isGirih: boolean;
  name: string;
  width: string;
  height: string;
  panelWidth: string;
  panelHeight: string;
  starOrder: number;
  /** Highest order of rotation of the whole pattern. */
  rotationOrder: number;
  parts: GirihPart[];
  /** Openings to cut in one stencil sheet. */
  openings: number;
  notes: string[];
  steps: string[];
};

export const GIRIH_TILES = ["decagon", "pentagon", "bowtie", "rhombus", "hexagon"] as const;
export type GirihTileId = (typeof GIRIH_TILES)[number];

type Phrase = keyof typeof text.en.phrases;

export function girihSay(locale: Locale, key: Phrase, values: Record<string, string | number> = {}): string {
  return text[locale].phrases[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

/** A tile with its lines, in lattice units. `star` is its number of points, when it makes a single star. */
export type GirihTile = {
  id: GirihTileId | "polygon";
  polygon: Vec[];
  center: Vec;
  star: number | null;
  /** Strapwork as closed polygons. Midpoints of the tile's edges are corners of these. */
  loops: Vec[][];
  /** The rosette's inner polygon and the lines from it out to the star. */
  inner: Vec[] | null;
  spokes: [Vec, Vec][];
  main: boolean;
};

export type GirihScene = {
  group: WallpaperGroup;
  isGirih: boolean;
  starOrder: number;
  /** Every tile that reaches into the repeat, with its copies across each edge. */
  tiles: GirihTile[];
  /** One entry per tile in a repeat, however many times it's drawn. */
  tilesPerRepeat: GirihTile[];
  /** Length that plays the part of a girih edge, so line weights look alike across options. */
  edge: number;
};

const DEG = Math.PI / 180;
const EPS = 1e-7;
/** The angle at which girih lines leave an edge. */
export const GIRIH_ANGLE = 54;
const SHARP_ANGLE = 72;
/** A girih decagon's distance from center to edge midpoint, when its edge is 1. */
const DECAGON_APOTHEM = 0.5 / Math.tan(18 * DEG);

const TILE_ANGLES: Record<GirihTileId, number[]> = {
  decagon: Array<number>(10).fill(144),
  pentagon: Array<number>(5).fill(108),
  bowtie: [72, 72, 216, 72, 72, 216],
  rhombus: [72, 108, 72, 108],
  hexagon: [72, 144, 144, 72, 144, 144],
};

const direction = (degrees: number): Vec => [Math.cos(degrees * DEG), Math.sin(degrees * DEG)];
const midpoint = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const centerOf = (points: readonly Vec[]): Vec => [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];

/** Signed area: positive when the corners run counterclockwise in x-right, y-up terms. */
export function polygonArea(points: readonly Vec[]): number {
  let sum = 0;
  points.forEach(([x0, y0], i) => {
    const [x1, y1] = points[(i + 1) % points.length];
    sum += x0 * y1 - x1 * y0;
  });
  return sum / 2;
}

/** A tile's corners, walking its unit edges from `start`, with the first edge at turn x 36 degrees. */
export function tileCorners(id: GirihTileId, start: Vec = [0, 0], turn = 0): Vec[] {
  const angles = TILE_ANGLES[id];
  const corners: Vec[] = [];
  let [x, y] = start;
  let heading = turn * 36;
  angles.forEach((_, i) => {
    corners.push([x, y]);
    const [dx, dy] = direction(heading);
    x += dx;
    y += dy;
    heading += 180 - angles[(i + 1) % angles.length];
  });
  return corners;
}

function crossing(a: Vec, da: Vec, b: Vec, db: Vec): Vec {
  const det = da[0] * db[1] - da[1] * db[0];
  const t = ((b[0] - a[0]) * db[1] - (b[1] - a[1]) * db[0]) / det;
  return [a[0] + da[0] * t, a[1] + da[1] * t];
}

/** The line leaving edge i's midpoint into the tile, toward the edge's end or its start. */
function strapDirection(corners: readonly Vec[], i: number, angle: number, forward: boolean): Vec {
  const [ax, ay] = corners[i];
  const [bx, by] = corners[(i + 1) % corners.length];
  const heading = Math.atan2(by - ay, bx - ax) / DEG;
  return direction(heading + (forward ? angle : 180 - angle));
}

/** Goes round a convex tile: each corner's two lines meet on its bisector, straight through if they line up. */
function convexLoop(corners: readonly Vec[], angle: number): Vec[] {
  const n = corners.length;
  const loop: Vec[] = [];
  corners.forEach((_, i) => {
    const before = i === 0 ? n - 1 : i - 1;
    const a = midpoint(corners[before], corners[i]);
    const b = midpoint(corners[i], corners[(i + 1) % n]);
    const da = strapDirection(corners, before, angle, true);
    const db = strapDirection(corners, i, angle, false);
    if (Math.abs(da[0] * db[1] - da[1] * db[0]) > EPS) loop.push(crossing(a, da, b, db));
    loop.push(b);
  });
  return loop;
}

/**
 * The lines toward a bowtie's two inward corners can't meet at them, since the waist is
 * too narrow. Each pairs with the line across the same wing, giving two kites.
 */
function bowtieLoops(corners: readonly Vec[]): Vec[][] {
  const mid = corners.map((p, i) => midpoint(p, corners[(i + 1) % corners.length]));
  const dir = (i: number, forward: boolean) => strapDirection(corners, i, GIRIH_ANGLE, forward);
  return [
    [mid[5], mid[0], mid[1], crossing(mid[1], dir(1, true), mid[5], dir(5, false))],
    [mid[2], mid[3], mid[4], crossing(mid[2], dir(2, false), mid[4], dir(4, true))],
  ];
}

/**
 * The ring of petals inside a star: from each notch to a point on the line toward the
 * star's tip. Where the star's lines reach that far, the point is where two of them cross,
 * so the petals' sides carry those lines straight on. On 4 and 6-fold stars they don't.
 */
function rosette(center: Vec, loop: readonly Vec[], angle: number): { inner: Vec[]; spokes: [Vec, Vec][] } {
  const n = loop.length / 2;
  const apothem = Math.hypot(loop[1][0] - center[0], loop[1][1] - center[1]);
  const notch = Math.hypot(loop[0][0] - center[0], loop[0][1] - center[1]);
  const reach = angle * DEG > (2 * Math.PI) / n + EPS ? (apothem * Math.cos(angle * DEG)) / Math.cos(angle * DEG - (2 * Math.PI) / n) : notch * 0.5;
  const inner: Vec[] = [];
  const spokes: [Vec, Vec][] = [];
  for (let i = 0; i < n; i++) {
    const tip = loop[i * 2 + 1];
    const k = reach / apothem;
    const point: Vec = [center[0] + (tip[0] - center[0]) * k, center[1] + (tip[1] - center[1]) * k];
    inner.push(point);
    spokes.push([loop[i * 2], point], [loop[(i * 2 + 2) % loop.length], point]);
  }
  return { inner, spokes };
}

/** Where a tile's corner sits, as whole steps along the five edge directions. It keeps the patch exact. */
type PatchEntry = { tile: GirihTileId; steps: readonly [number, number, number, number, number]; turn: number };

/**
 * One repeat of true girih, found by an exhaustive computer search for periodic edge-to-edge
 * tilings with all five tiles, keeping the most symmetric small one. Invented that way, it
 * isn't taken from any building. `girih.test.ts` checks that it fills the plane.
 */
const GIRIH_PATCH: readonly PatchEntry[] = [
  { tile: "decagon", steps: [0, 0, 0, 0, 0], turn: 0 },
  { tile: "rhombus", steps: [1, 1, 0, 0, -1], turn: 4 },
  { tile: "pentagon", steps: [1, 1, 0, 0, 0], turn: 9 },
  { tile: "rhombus", steps: [1, 2, 0, 0, -2], turn: 4 },
  { tile: "decagon", steps: [1, 2, 0, 0, -1], turn: 9 },
  { tile: "hexagon", steps: [3, 3, 0, 0, -3], turn: 4 },
  { tile: "bowtie", steps: [2, 3, 0, 0, -2], turn: 0 },
  { tile: "pentagon", steps: [1, 1, 1, 0, 0], turn: 0 },
];

const PHI = (1 + Math.sqrt(5)) / 2;
const PATCH_WIDTH = 3 * PHI * PHI;
const PATCH_HEIGHT = 2 * DECAGON_APOTHEM;
/** The patch has mirror lines at this x and at y = 0, and again every half repeat. */
const PATCH_MIRROR_X = PHI * PHI;

/**
 * The patch's symmetries, in the wallpaper engine's own terms. Its width and height aren't
 * those of the engine's pmm, so the group is spelled out; everything else is unchanged.
 */
export function girihGroup(): WallpaperGroup {
  return {
    id: "pmm",
    family: "rectangular",
    basis: [[PATCH_WIDTH, 0], [0, PATCH_HEIGHT]],
    cell: { width: PATCH_WIDTH, height: PATCH_HEIGHT },
    generators: [[-1, 0, 0, 1, 2 * PATCH_MIRROR_X, 0], [1, 0, 0, -1, 0, 0]],
    domain: [[PATCH_MIRROR_X, 0], [PATCH_MIRROR_X + PATCH_WIDTH / 2, 0], [PATCH_MIRROR_X + PATCH_WIDTH / 2, PATCH_HEIGHT / 2], [PATCH_MIRROR_X, PATCH_HEIGHT / 2]],
  };
}

function patchTile(entry: PatchEntry, star: GirihStar): GirihTile {
  const start = entry.steps.reduce<Vec>((sum, count, k) => {
    const [dx, dy] = direction(k * 36);
    return [sum[0] + dx * count, sum[1] + dy * count];
  }, [0, 0]);
  const polygon = tileCorners(entry.tile, start, entry.turn);
  const center = centerOf(polygon);
  const loops = entry.tile === "bowtie" ? bowtieLoops(polygon) : [convexLoop(polygon, GIRIH_ANGLE)];
  const main = entry.tile === "decagon";
  const petals = main && star === "rosette" ? rosette(center, loops[0], GIRIH_ANGLE) : null;
  return {
    id: entry.tile,
    polygon,
    center,
    star: entry.tile === "decagon" ? 10 : entry.tile === "pentagon" ? 5 : null,
    loops,
    inner: petals?.inner ?? null,
    spokes: petals?.spokes ?? [],
    main,
  };
}

type PolygonSeed = { center: Vec; sides: number; apothem: number; /** Direction of the first edge's midpoint. */ start: number; main: boolean };

const ROOT3 = Math.sqrt(3);
const HEX_SCALE = 3.4;
const SQUARE_APOTHEM = 1.5;
const HEX_APOTHEM = HEX_SCALE / 2;

/** Regular polygons that meet edge to edge, each centered on one of the group's rotation centers. */
const STAR_LAYOUTS: Record<Exclude<GirihSymmetry, 10>, { group: "p4m" | "p6m"; seeds: PolygonSeed[] }> = {
  4: { group: "p4m", seeds: [{ center: [0, 0], sides: 4, apothem: SQUARE_APOTHEM, start: 0, main: true }] },
  // Octagons with squares in the gaps.
  8: {
    group: "p4m",
    seeds: [
      { center: [0, 0], sides: 8, apothem: SQUARE_APOTHEM, start: 0, main: true },
      { center: [SQUARE_APOTHEM, SQUARE_APOTHEM], sides: 4, apothem: SQUARE_APOTHEM * Math.tan(22.5 * DEG), start: 45, main: false },
    ],
  },
  6: { group: "p6m", seeds: [{ center: [0, 0], sides: 6, apothem: HEX_APOTHEM, start: 0, main: true }] },
  // Dodecagons with triangles in the gaps.
  12: {
    group: "p6m",
    seeds: [
      { center: [0, 0], sides: 12, apothem: HEX_APOTHEM, start: 0, main: true },
      { center: [HEX_APOTHEM, HEX_APOTHEM / ROOT3], sides: 3, apothem: (HEX_APOTHEM * Math.tan(15 * DEG)) / ROOT3, start: 90, main: false },
    ],
  },
};

function polygonTile(seed: PolygonSeed, star: GirihStar): GirihTile {
  const { center, sides, apothem, start, main } = seed;
  const radius = apothem / Math.cos(Math.PI / sides);
  const polygon = Array.from({ length: sides }, (_, i): Vec => {
    const [dx, dy] = direction(start - 180 / sides + (i * 360) / sides);
    return [center[0] + dx * radius, center[1] + dy * radius];
  });
  const angle = star === "sharp" ? SHARP_ANGLE : GIRIH_ANGLE;
  const loop = convexLoop(polygon, angle);
  const petals = main && star === "rosette" ? rosette(center, loop, angle) : null;
  return { id: "polygon", polygon, center, star: sides, loops: [loop], inner: petals?.inner ?? null, spokes: petals?.spokes ?? [], main };
}

function mapTile(tile: GirihTile, op: Affine): GirihTile {
  const map = (p: Vec) => applyAffine(op, p);
  return {
    ...tile,
    polygon: tile.polygon.map(map),
    center: map(tile.center),
    loops: tile.loops.map((loop) => loop.map(map)),
    inner: tile.inner?.map(map) ?? null,
    spokes: tile.spokes.map(([a, b]): [Vec, Vec] => [map(a), map(b)]),
  };
}

const keyOf = ([x, y]: Vec) => `${Math.round(x * 1e4) || 0},${Math.round(y * 1e4) || 0}`;

/** True for a point in the repeat rectangle, counting two of its sides, so each copy is counted once. */
function inCell(group: WallpaperGroup, [x, y]: Vec): boolean {
  return x >= -EPS && y >= -EPS && x < group.cell.width - EPS && y < group.cell.height - EPS;
}

/** Sets a star type the option can't draw back to the plain star. */
export function usableStar(symmetry: GirihSymmetry, star: GirihStar): GirihStar {
  return symmetry === 10 && star === "sharp" ? "star" : star;
}

export function girihScene(symmetry: GirihSymmetry, star: GirihStar): GirihScene {
  const usable = usableStar(symmetry, star);
  const isGirih = symmetry === 10;
  const layout = isGirih ? null : STAR_LAYOUTS[symmetry];
  const group = layout ? wallpaperGroup(layout.group) : girihGroup();
  const seeds = layout ? layout.seeds.map((seed) => polygonTile(seed, usable)) : GIRIH_PATCH.map((entry) => patchTile(entry, usable));

  // The wallpaper engine places every copy. A tile sitting on a rotation center maps onto
  // itself, so copies with the same center are one tile.
  const tiles = new Map<string, GirihTile>();
  for (const seed of seeds) {
    for (const op of tileSymmetries(group, seed.polygon)) {
      const copy = mapTile(seed, op);
      const key = `${copy.id}:${keyOf(copy.center)}`;
      if (!tiles.has(key)) tiles.set(key, copy);
    }
  }
  const all = [...tiles.values()];
  const apothem = layout ? layout.seeds[0].apothem : DECAGON_APOTHEM;
  return {
    group,
    isGirih,
    starOrder: symmetry,
    tiles: all,
    tilesPerRepeat: all.filter((tile) => inCell(group, tile.center)),
    edge: apothem / DECAGON_APOTHEM,
  };
}

/** Every strap as a straight piece between two corners of the drawing. */
export function tileSegments(tile: GirihTile): [Vec, Vec][] {
  const closed = (loop: readonly Vec[]) => loop.map((p, i): [Vec, Vec] => [p, loop[(i + 1) % loop.length]]);
  return [...tile.loops.flatMap(closed), ...(tile.inner ? closed(tile.inner) : []), ...tile.spokes];
}

/** The regions the lines divide the plane into: each traced with the region on its left. */
export function strapFaces(tiles: readonly GirihTile[]): Vec[][] {
  const points = new Map<string, Vec>();
  const neighbors = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!neighbors.has(a)) neighbors.set(a, new Set());
    neighbors.get(a)!.add(b);
  };
  for (const tile of tiles) {
    for (const [a, b] of tileSegments(tile)) {
      const ka = keyOf(a);
      const kb = keyOf(b);
      points.set(ka, a);
      points.set(kb, b);
      link(ka, kb);
      link(kb, ka);
    }
  }
  const angleFrom = (from: string, to: string) => {
    const [x0, y0] = points.get(from)!;
    const [x1, y1] = points.get(to)!;
    return Math.atan2(y1 - y0, x1 - x0);
  };
  // At each corner, turning as far right as possible from the way back follows the region's edge.
  const sorted = new Map([...neighbors].map(([k, set]) => [k, [...set].sort((a, b) => angleFrom(k, a) - angleFrom(k, b))]));
  const seen = new Set<string>();
  const faces: Vec[][] = [];
  for (const [from, list] of sorted) {
    for (const to of list) {
      if (seen.has(`${from}>${to}`)) continue;
      const face: Vec[] = [];
      let [a, b] = [from, to];
      while (!seen.has(`${a}>${b}`)) {
        seen.add(`${a}>${b}`);
        face.push(points.get(a)!);
        const around = sorted.get(b)!;
        const back = around.indexOf(a);
        const next = around[(back + around.length - 1) % around.length];
        [a, b] = [b, next];
      }
      if (polygonArea(face) > EPS) faces.push(face);
    }
  }
  return faces;
}

/** Moves each side inward by `distance`. Null if the shape is too small or narrow to survive it. */
export function insetPolygon(polygon: readonly Vec[], distance: number): Vec[] | null {
  const n = polygon.length;
  const offset = (i: number) => {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % n];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const dir: Vec = [(x1 - x0) / length, (y1 - y0) / length];
    const start: Vec = [x0 - (dir[1] * distance), y0 + dir[0] * distance];
    return { dir, start };
  };
  const result = polygon.map((corner, i): Vec => {
    const a = offset(i === 0 ? n - 1 : i - 1);
    const b = offset(i);
    if (Math.abs(a.dir[0] * b.dir[1] - a.dir[1] * b.dir[0]) > 1e-6) return crossing(a.start, a.dir, b.start, b.dir);
    return [corner[0] - b.dir[1] * distance, corner[1] + b.dir[0] * distance];
  });
  // A side that has flipped over means this inset went too far.
  for (let i = 0; i < n; i++) {
    const [x0, y0] = result[i];
    const [x1, y1] = result[(i + 1) % n];
    const { dir } = offset(i);
    if ((x1 - x0) * dir[0] + (y1 - y0) * dir[1] <= EPS) return null;
  }
  return isSimple(result) ? result : null;
}

function segmentsCross(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  const side = (p: Vec, q: Vec, r: Vec) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return side(a, b, c) * side(a, b, d) < -1e-12 && side(c, d, a) * side(c, d, b) < -1e-12;
}

/** True when no two sides of a polygon cross. */
export function isSimple(polygon: readonly Vec[]): boolean {
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsCross(polygon[i], polygon[(i + 1) % n], polygon[j], polygon[(j + 1) % n])) return false;
    }
  }
  return true;
}

export type GirihStencil = {
  width: number;
  height: number;
  /** Cut these out. Copying the sheet one repeat over paints each shape exactly once. */
  openings: Vec[][];
  /** Small holes one repeat apart, for lining the sheet up with what's already painted. */
  marks: Vec[][];
  repeatWidth: number;
  repeatHeight: number;
  /** Width of the bands left between openings. */
  bridge: number;
  /** Width of the solid edge around the openings. */
  frame: number;
};

/** SVG units per lattice unit. */
export const GIRIH_UNITS = 100;
const MIN_BRIDGE = 0.05;
const STENCIL_FRAME = 0.3;

const strokeOf = (req: Pick<GirihRequest, "lineWeight">, scene: GirihScene) => (req.lineWeight / 100) * scene.edge * GIRIH_UNITS;

/**
 * A stencil sheet. Lines between regions become solid bands, so every piece of the sheet
 * hangs together: it's one network of bands and a frame, with no islands. The sheet holds
 * one whole copy of each region whose center falls in the repeat, reaching past the repeat
 * where it must, rather than cutting a shape in two at the edge of the sheet.
 */
export function girihStencil(req: Pick<GirihRequest, "symmetry" | "star" | "lineWeight">): GirihStencil {
  const scene = girihScene(req.symmetry, req.star);
  const { width, height } = scene.group.cell;
  const around = [-1, 0, 1].flatMap((i) =>
    [-1, 0, 1].flatMap((j) =>
      scene.tilesPerRepeat.map((tile) => mapTile(tile, [1, 0, 0, 1, i * width, j * height])),
    ),
  );
  const bridge = Math.max(strokeOf(req, scene) / GIRIH_UNITS, MIN_BRIDGE * scene.edge);
  const openings = strapFaces(around)
    .filter((face) => inCell(scene.group, areaCenter(face)))
    .map((face) => insetPolygon(face, bridge / 2))
    .filter((face): face is Vec[] => face !== null);

  const frame = STENCIL_FRAME * scene.edge;
  const corners = openings.flat();
  const minX = Math.min(0, ...corners.map(([x]) => x)) - frame;
  const minY = Math.min(0, ...corners.map(([, y]) => y)) - frame;
  const maxX = Math.max(width, ...corners.map(([x]) => x)) + frame;
  const maxY = Math.max(height, ...corners.map(([, y]) => y)) + frame;
  const shift = ([x, y]: Vec): Vec => [x - minX, y - minY];
  const radius = frame * 0.25;
  const hole = ([x, y]: Vec) => Array.from({ length: 12 }, (_, i): Vec => [x + radius * Math.cos((i * Math.PI) / 6), y + radius * Math.sin((i * Math.PI) / 6)]);

  return {
    width: maxX - minX,
    height: maxY - minY,
    openings: openings.map((face) => face.map(shift)),
    marks: ([[0, minY + frame / 2], [width, minY + frame / 2], [minX + frame / 2, 0], [minX + frame / 2, height]] as Vec[]).map((p) => hole(shift(p))),
    repeatWidth: width,
    repeatHeight: height,
    bridge,
    frame,
  };
}

/** The balance point of a polygon, which unlike the average of its corners doesn't depend on how they're spaced. */
function areaCenter(points: readonly Vec[]): Vec {
  const area = polygonArea(points);
  let cx = 0;
  let cy = 0;
  points.forEach(([x0, y0], i) => {
    const [x1, y1] = points[(i + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  });
  return [cx / (6 * area), cy / (6 * area)];
}

/** Keeps the part of a polygon inside a rectangle, one side at a time. */
export function clipPolygon(points: readonly Vec[], x0: number, y0: number, x1: number, y1: number): Vec[] {
  const sides: ((p: Vec) => number)[] = [(p) => p[0] - x0, (p) => x1 - p[0], (p) => p[1] - y0, (p) => y1 - p[1]];
  let out = [...points];
  for (const inside of sides) {
    const next: Vec[] = [];
    out.forEach((p, i) => {
      const q = out[(i + 1) % out.length];
      const a = inside(p);
      const b = inside(q);
      if (a >= 0) next.push(p);
      if (a >= 0 !== b >= 0) next.push([p[0] + ((q[0] - p[0]) * a) / (a - b), p[1] + ((q[1] - p[1]) * a) / (a - b)]);
    });
    out = next;
  }
  return out;
}

/** Keeps the part of a line inside a rectangle. */
export function clipSegment([a, b]: [Vec, Vec], x0: number, y0: number, x1: number, y1: number): [Vec, Vec] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}

const fmt = (value: number) => Number((value * GIRIH_UNITS).toFixed(2));
const closedPath = (points: readonly Vec[]) => `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`;
const linePath = ([a, b]: [Vec, Vec]) => `M${fmt(a[0])} ${fmt(a[1])}L${fmt(b[0])} ${fmt(b[1])}`;

/** Plain JSON for one drawn path, shared by the SVG and the PDF. Lengths are in SVG units. */
export type GirihShape = { d: string; fill?: string; stroke?: string; strokeWidth?: number };

/** One repeat, ready to draw. With `clip`, it stays inside the repeat, for formats that can't clip. */
export function girihShapes(req: GirihRequest, scene: GirihScene, clip = false): GirihShape[] {
  const { width, height } = scene.group.cell;
  const stroke = strokeOf(req, scene);
  const pad = (stroke * 1.5) / GIRIH_UNITS;
  const fillOf = (points: Vec[]) => (clip ? clipPolygon(points, 0, 0, width, height) : points);
  const lineOf = (segment: [Vec, Vec]) => (clip ? clipSegment(segment, -pad, -pad, width + pad, height + pad) : segment);
  const paths = (polygons: Vec[][]) => polygons.map(fillOf).filter((p) => p.length > 2).map(closedPath).join("");

  const primary = paths(scene.tiles.filter((t) => t.main).flatMap((t) => t.loops));
  const accent = paths(scene.tiles.flatMap((t) => [...(t.main ? [] : t.loops), ...(t.inner ? [t.inner] : [])]));
  const edges = scene.tiles.flatMap((t) => t.polygon.map((p, i): [Vec, Vec] => [p, t.polygon[(i + 1) % t.polygon.length]]));
  const lines = scene.tiles.flatMap(tileSegments);
  const draw = (segments: [Vec, Vec][]) => segments.map(lineOf).filter((s): s is [Vec, Vec] => s !== null).map(linePath).join("");

  return [
    { d: primary, fill: req.colors.primary },
    { d: accent, fill: req.colors.accent },
    ...(req.showTiles ? [{ d: draw(edges), stroke: req.colors.line, strokeWidth: Math.max(0.5, stroke / 4) }] : []),
    { d: draw(lines), stroke: req.colors.line, strokeWidth: stroke },
  ];
}

const shapeMarkup = (shapes: GirihShape[]) =>
  shapes.map((s) => `<path d="${s.d}" fill="${s.fill ?? "none"}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${Number(s.strokeWidth!.toFixed(3))}" stroke-linejoin="round"` : ""}/>`).join("");

const round3 = (value: number) => Number(value.toFixed(3));

function svgOpen(w: number, h: number, widthIn: number, heightIn: number, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round3(w)} ${round3(h)}" width="${round3(widthIn)}in" height="${round3(heightIn)}in" role="img"><title>${title}</title>`;
}

function repeatSvg(req: GirihRequest, scene: GirihScene, title: string): string {
  const w = scene.group.cell.width * GIRIH_UNITS;
  const h = scene.group.cell.height * GIRIH_UNITS;
  const ratio = h / w;
  return `${svgOpen(w, h, req.repeatWidth, req.repeatWidth * ratio, title)}<rect x="-1" y="-1" width="${round3(w + 2)}" height="${round3(h + 2)}" fill="${req.colors.background}"/>${shapeMarkup(girihShapes(req, scene))}</svg>`;
}

/** Repeats side by side inside a plain border, as a panel to hang or paint. */
function panelSvg(req: GirihRequest, scene: GirihScene, title: string): string {
  const cw = scene.group.cell.width * GIRIH_UNITS;
  const ch = scene.group.cell.height * GIRIH_UNITS;
  const w = cw * req.across;
  const h = ch * req.down;
  const c = req.colors;
  // Same id means same content: it's built from everything that goes into the repeat.
  const id = `girih-${req.symmetry}-${usableStar(req.symmetry, req.star)}-${req.lineWeight}${req.showTiles ? "-t" : ""}-${[c.primary, c.accent, c.line].map((v) => v.slice(1)).join("")}`;
  const uses: string[] = [];
  for (let y = 0; y < req.down; y++) for (let x = 0; x < req.across; x++) uses.push(`<use href="#${id}" x="${round3(x * cw)}" y="${round3(y * ch)}"/>`);
  const border = Math.max(strokeOf(req, scene) * 2, 4);
  const heightIn = (req.repeatWidth * ch * req.down) / cw;
  return `${svgOpen(w, h, req.repeatWidth * req.across, heightIn, title)}<defs><clipPath id="${id}-cell"><rect width="${round3(cw)}" height="${round3(ch)}"/></clipPath><g id="${id}" clip-path="url(#${id}-cell)">${shapeMarkup(girihShapes(req, scene))}</g></defs><rect x="-1" y="-1" width="${round3(w + 2)}" height="${round3(h + 2)}" fill="${c.background}"/>${uses.join("")}<rect x="${border / 2}" y="${border / 2}" width="${round3(w - border)}" height="${round3(h - border)}" fill="none" stroke="${c.line}" stroke-width="${round3(border)}"/></svg>`;
}

function stencilSvg(req: GirihRequest, stencil: GirihStencil, title: string): string {
  const w = stencil.width * GIRIH_UNITS;
  const h = stencil.height * GIRIH_UNITS;
  const scale = req.repeatWidth / (stencil.repeatWidth * GIRIH_UNITS);
  const sheet = `M0 0H${round3(w)}V${round3(h)}H0Z`;
  const cuts = [...stencil.openings, ...stencil.marks].map(closedPath).join("");
  return `${svgOpen(w, h, w * scale, h * scale, title)}<path d="${sheet}${cuts}" fill="#1d2b3a" fill-rule="evenodd"/></svg>`;
}

export function generateGirih(req: GirihRequest): GirihResult {
  const locale = req.locale ?? "en";
  if (!GIRIH_SYMMETRIES.includes(req.symmetry)) throw new Error(`Unknown symmetry: ${req.symmetry}`);
  const catalog = text[locale];
  const star = usableStar(req.symmetry, req.star);
  const scene = girihScene(req.symmetry, star);
  const stencil = girihStencil({ ...req, star });
  const { cell } = scene.group;
  const heightIn = (req.repeatWidth * cell.height) / cell.width;
  const rotationOrder = Math.max(1, ...symmetryElements(scene.group).rotationOrders);
  const name = scene.isGirih ? catalog.phrases.nameGirih : girihSay(locale, "nameStar", { n: req.symmetry });
  const title = girihSay(locale, scene.isGirih ? "svgTitleGirih" : "svgTitleStar", { n: req.symmetry, star: catalog.stars[star] });

  const counts = new Map<string, GirihPart>();
  for (const tile of scene.tilesPerRepeat) {
    const id = tile.id === "polygon" ? `star${tile.star}` : tile.id;
    const part = counts.get(id) ?? { id, name: tile.id === "polygon" ? girihSay(locale, "partStar", { n: tile.star! }) : catalog.tiles[tile.id], count: 0 };
    part.count += 1;
    counts.set(id, part);
  }

  const width = inches(req.repeatWidth);
  const height = approxInches(heightIn);
  return {
    svg: {
      repeat: repeatSvg(req, scene, title),
      panel: panelSvg(req, scene, title),
      stencil: stencilSvg(req, stencil, girihSay(locale, "svgTitleStencil", { name })),
    },
    isGirih: scene.isGirih,
    name,
    width,
    height,
    panelWidth: inches(req.repeatWidth * req.across),
    panelHeight: approxInches(heightIn * req.down),
    starOrder: req.symmetry,
    rotationOrder,
    parts: [...counts.values()],
    openings: stencil.openings.length,
    notes: [
      ...(scene.isGirih ? [girihSay(locale, "noteGirih")] : []),
      girihSay(locale, "noteRotation", { star: req.symmetry, pattern: rotationOrder }),
      ...(req.symmetry === 8 || req.symmetry === 10 || req.symmetry === 12 ? [girihSay(locale, "noteLimit", { star: req.symmetry })] : []),
    ],
    steps: [
      girihSay(locale, "stepRepeat", { w: width, h: height }),
      girihSay(locale, "stepPanel", { across: req.across, down: req.down, w: inches(req.repeatWidth * req.across), h: approxInches(heightIn * req.down) }),
      girihSay(locale, "stepStencil", { n: stencil.openings.length }),
      girihSay(locale, "stepPaint"),
      girihSay(locale, "stepPrint"),
    ],
  };
}
