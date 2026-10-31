/**
 * The 17 wallpaper groups: lattices, generating symmetries and fundamental domains,
 * with no drawing in it, so other tools can build on it. Every group is defined by
 * its generators; everything else (copies, symmetry elements) is derived from those.
 */

export type Vec = readonly [number, number];

/** x' = a x + c y + e, y' = b x + d y + f: the same order as SVG's matrix(). */
export type Affine = readonly [number, number, number, number, number, number];

export const GROUP_IDS = ["p1", "p2", "pm", "pg", "cm", "pmm", "pmg", "pgg", "cmm", "p4", "p4m", "p4g", "p3", "p3m1", "p31m", "p6", "p6m"] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export type LatticeFamily = "oblique" | "rectangular" | "rhombic" | "square" | "hexagonal";

export type WallpaperGroup = {
  id: GroupId;
  family: LatticeFamily;
  /** Two vectors that generate every translation of the group. */
  basis: readonly [Vec, Vec];
  /** The smallest upright rectangle whose sides are translations: the repeat for an image file. */
  cell: { width: number; height: number };
  /** Together with the lattice, these generate the group. */
  generators: readonly Affine[];
  /** A convex polygon whose copies under the group fill the plane exactly once. */
  domain: readonly Vec[];
};

/** A line of symmetry: every x with n . x = offset, repeating every `period` along n = (-sin angle, cos angle). */
export type SymmetryLine = { angle: number; offset: number; period: number };
export type GlideLine = SymmetryLine & { shift: number };

export type SymmetryElements = {
  /** Rotation centers modulo the lattice, each with its highest order. */
  rotations: { order: number; center: Vec }[];
  rotationOrders: number[];
  mirrors: SymmetryLine[];
  /** Glide axes that aren't also mirrors. A mirror plus a translation along it is not counted. */
  glides: GlideLine[];
};

const EPS = 1e-7;
const ROOT3 = Math.sqrt(3);

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];

/** `f` after `g`. */
export function compose(f: Affine, g: Affine): Affine {
  return [
    f[0] * g[0] + f[2] * g[1],
    f[1] * g[0] + f[3] * g[1],
    f[0] * g[2] + f[2] * g[3],
    f[1] * g[2] + f[3] * g[3],
    f[0] * g[4] + f[2] * g[5] + f[4],
    f[1] * g[4] + f[3] * g[5] + f[5],
  ];
}

export function applyAffine(m: Affine, [x, y]: Vec): Vec {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export function invertAffine(m: Affine): Affine {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}

export const translation = (x: number, y: number): Affine => [1, 0, 0, 1, x, y];

/** A turn of 1/order about the origin. */
const turn = (order: number): Affine => {
  const c = Math.cos((2 * Math.PI) / order);
  const s = Math.sin((2 * Math.PI) / order);
  return [c, s, -s, c, 0, 0];
};

/** Flips x, flips y, with an optional shift: reflections when the shift runs across the axis, glides along it. */
const flipX = (x = 0, y = 0): Affine => [-1, 0, 0, 1, x, y];
const flipY = (x = 0, y = 0): Affine => [1, 0, 0, -1, x, y];

const box = (x0: number, y0: number, x1: number, y1: number): Vec[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

type Definition = Omit<WallpaperGroup, "id">;

const rect = (width: number, height: number) => ({
  basis: [[width, 0], [0, height]] as [Vec, Vec],
  cell: { width, height },
});
/** Lattice points at the corners and the center of the rectangle. */
const centered = (width: number, height: number) => ({
  basis: [[width / 2, height / 2], [-width / 2, height / 2]] as [Vec, Vec],
  cell: { width, height },
});
/** A true hexagonal lattice has no square repeat: its smallest upright rectangle is 1 : sqrt(3). */
const hex = (a: number) => ({
  basis: [[a, 0], [-a / 2, (a * ROOT3) / 2]] as [Vec, Vec],
  cell: { width: a, height: a * ROOT3 },
});

// Sizes are chosen so each group's domain has about the same area, which keeps a motif
// about the same size from group to group. The oblique lattices are skewed by 1/3 of a
// side so they stay truly oblique but still have an upright rectangular repeat.
const DEFINITIONS: Record<GroupId, Definition> = {
  p1: { family: "oblique", basis: [[1.5, 0], [0.5, 0.8]], cell: { width: 1.5, height: 2.4 }, generators: [], domain: [[0, 0], [1.5, 0], [2, 0.8], [0.5, 0.8]] },
  p2: { family: "oblique", basis: [[1.5, 0], [0.5, 1.2]], cell: { width: 1.5, height: 3.6 }, generators: [turn(2)], domain: [[0, 0], [1.5, 0], [1.75, 0.6], [0.25, 0.6]] },
  pm: { family: "rectangular", ...rect(2, 1.2), generators: [flipX()], domain: box(0, 0, 1, 1.2) },
  pg: { family: "rectangular", ...rect(1.2, 2), generators: [flipX(0, 1)], domain: box(0, 0, 1.2, 1) },
  cm: { family: "rhombic", ...centered(2, 1.6), generators: [flipX()], domain: box(0, 0, 1, 0.8) },
  pmm: { family: "rectangular", ...rect(2, 1.6), generators: [flipX(), flipY()], domain: box(0, 0, 1, 0.8) },
  pmg: { family: "rectangular", ...rect(2, 1.6), generators: [turn(2), flipX(1, 0)], domain: box(0.5, 0, 1.5, 0.8) },
  pgg: { family: "rectangular", ...rect(2, 1.6), generators: [turn(2), flipY(1, 0.8)], domain: box(0, 0, 1, 0.8) },
  cmm: { family: "rhombic", ...centered(2, 3.2), generators: [flipX(), flipY()], domain: box(0, 0, 1, 0.8) },
  p4: { family: "square", ...rect(2, 2), generators: [turn(4)], domain: box(0, 0, 1, 1) },
  p4m: { family: "square", ...rect(3, 3), generators: [turn(4), flipX()], domain: [[0, 0], [1.5, 0], [1.5, 1.5]] },
  p4g: { family: "square", ...rect(3, 3), generators: [turn(4), flipX(1.5, 1.5)], domain: [[0, 0], [1.5, 0], [0, 1.5]] },
  p3: { family: "hexagonal", ...hex(1.8), generators: [turn(3)], domain: [[0, 0], [0.9, 0.3 * ROOT3], [0.9, 0.9 * ROOT3], [0, 0.6 * ROOT3]] },
  // In p3m1 the mirrors run across the shortest lattice vectors, so every 3-fold center is on one.
  p3m1: { family: "hexagonal", ...hex(2.4), generators: [turn(3), flipX()], domain: [[0, 0], [1.2, 0.4 * ROOT3], [0, 0.8 * ROOT3]] },
  // In p31m they run along those vectors, which leaves some 3-fold centers off the mirrors.
  p31m: { family: "hexagonal", ...hex(2.4), generators: [turn(3), flipY()], domain: [[0, 0], [2.4, 0], [1.2, 0.4 * ROOT3]] },
  p6: { family: "hexagonal", ...hex(2.4), generators: [turn(6)], domain: [[0, 0], [1.2, 0], [1.2, 0.4 * ROOT3], [0.6, 0.6 * ROOT3]] },
  p6m: { family: "hexagonal", ...hex(3.4), generators: [turn(6), flipY()], domain: [[0, 0], [1.7, 0], [1.7, (1.7 * ROOT3) / 3]] },
};

const scaleAffine = (m: Affine, k: number): Affine => [m[0], m[1], m[2], m[3], m[4] * k, m[5] * k];
const scaleVec = ([x, y]: Vec, k: number): Vec => [x * k, y * k];

/** A group's definition. `scale` multiplies its lengths, keeping its shape. */
export function wallpaperGroup(id: GroupId, scale = 1): WallpaperGroup {
  const def = DEFINITIONS[id];
  if (!def) throw new Error(`Unknown wallpaper group: ${id}`);
  return {
    id,
    family: def.family,
    basis: [scaleVec(def.basis[0], scale), scaleVec(def.basis[1], scale)],
    cell: { width: def.cell.width * scale, height: def.cell.height * scale },
    generators: def.generators.map((g) => scaleAffine(g, scale)),
    domain: def.domain.map((p) => scaleVec(p, scale)),
  };
}

export const allWallpaperGroups = (): WallpaperGroup[] => GROUP_IDS.map((id) => wallpaperGroup(id));

/** Coordinates in the lattice basis. */
function latticeCoords(group: WallpaperGroup, [x, y]: Vec): Vec {
  const [[ax, ay], [bx, by]] = group.basis;
  const det = ax * by - ay * bx;
  return [(x * by - y * bx) / det, (y * ax - x * ay) / det];
}

/** A number's part above its floor, with values a hair under 1 treated as 0. */
function wrap01(value: number): number {
  const part = value - Math.floor(value);
  return part > 1 - EPS ? 0 : part;
}

/** The equivalent point inside the lattice's basic parallelogram. */
export function reduceToLattice(group: WallpaperGroup, point: Vec): Vec {
  const [u, v] = latticeCoords(group, point);
  const [[ax, ay], [bx, by]] = group.basis;
  const fu = wrap01(u);
  const fv = wrap01(v);
  return [fu * ax + fv * bx, fu * ay + fv * by];
}

/** True when a vector is a translation of the group. */
export function isLatticeVector(group: WallpaperGroup, vector: Vec, tolerance = EPS): boolean {
  const [u, v] = latticeCoords(group, vector);
  return Math.abs(u - Math.round(u)) < tolerance && Math.abs(v - Math.round(v)) < tolerance;
}

/** True when two symmetries differ only by a translation of the group. */
export function sameModLattice(group: WallpaperGroup, f: Affine, g: Affine, tolerance = EPS): boolean {
  for (let i = 0; i < 4; i++) if (Math.abs(f[i] - g[i]) > tolerance) return false;
  return isLatticeVector(group, [f[4] - g[4], f[5] - g[5]], tolerance);
}

const keyOf = (values: readonly number[]) => values.map((n) => Math.round(n * 1e5) || 0).join(",");

/** One symmetry per point-group element: the whole group, modulo its translations. */
export function cosets(group: WallpaperGroup): Affine[] {
  const reduced = (m: Affine): Affine => {
    const [e, f] = reduceToLattice(group, [m[4], m[5]]);
    return [m[0], m[1], m[2], m[3], e, f];
  };
  const found = new Map<string, Affine>([[keyOf(IDENTITY), IDENTITY]]);
  const queue: Affine[] = [IDENTITY];
  while (queue.length) {
    const current = queue.shift()!;
    for (const generator of group.generators) {
      const next = reduced(compose(generator, current));
      const key = keyOf(next);
      if (found.has(key)) continue;
      found.set(key, next);
      queue.push(next);
    }
    // A wallpaper group's point group never has more than 12 elements.
    if (found.size > 12) throw new Error(`Generators of ${group.id} don't close`);
  }
  return [...found.values()];
}

/** The lattice's points inside the repeat rectangle. */
export function cellTranslations(group: WallpaperGroup): Vec[] {
  const { width, height } = group.cell;
  const found = new Map<string, Vec>();
  const reach = Math.ceil((Math.max(width, height) * 2) / Math.min(Math.hypot(...group.basis[0]), Math.hypot(...group.basis[1]))) + 1;
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const x = i * group.basis[0][0] + j * group.basis[1][0];
      const y = i * group.basis[0][1] + j * group.basis[1][1];
      const point: Vec = [wrap01(x / width) * width, wrap01(y / height) * height];
      found.set(keyOf(point), point);
    }
  }
  return [...found.values()];
}

/** One symmetry per copy in the repeat rectangle: the group modulo the rectangle's sides. */
export function cellSymmetries(group: WallpaperGroup): Affine[] {
  const { width, height } = group.cell;
  return cosets(group).flatMap((op) =>
    cellTranslations(group).map(([x, y]): Affine => {
      const e = op[4] + x;
      const f = op[5] + y;
      return [op[0], op[1], op[2], op[3], wrap01(e / width) * width, wrap01(f / height) * height];
    }),
  );
}

function boundsOf(points: readonly Vec[]) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/**
 * Everything to draw for one seamless repeat: each copy of `region`, plus its
 * wrapped-around twins, whenever the copy reaches into the rectangle. A copy over an
 * edge appears once on each side of it, so opposite edges of the tile always match.
 */
export function tileSymmetries(group: WallpaperGroup, region: readonly Vec[], margin = 0): Affine[] {
  const { width, height } = group.cell;
  return cellSymmetries(group).flatMap((op) => {
    const { minX, maxX, minY, maxY } = boundsOf(region.map((p) => applyAffine(op, p)));
    const placed: Affine[] = [];
    for (let i = Math.ceil((-margin - maxX) / width - EPS); i * width + minX < width + margin - EPS; i++) {
      for (let j = Math.ceil((-margin - maxY) / height - EPS); j * height + minY < height + margin - EPS; j++) {
        placed.push(compose(translation(i * width, j * height), op));
      }
    }
    return placed;
  });
}

const isReflecting = (m: Affine) => m[0] * m[3] - m[1] * m[2] < 0;

const positiveMod = (value: number, period: number) => {
  const part = ((value % period) + period) % period;
  return period - part < EPS ? 0 : part;
};

/** The shortest step between parallel lines of the lattice, measured along `normal`. */
function linePeriod(group: WallpaperGroup, normal: Vec): number {
  let period = Infinity;
  for (let i = -8; i <= 8; i++) {
    for (let j = -8; j <= 8; j++) {
      const step = Math.abs((i * group.basis[0][0] + j * group.basis[1][0]) * normal[0] + (i * group.basis[0][1] + j * group.basis[1][1]) * normal[1]);
      if (step > EPS && step < period) period = step;
    }
  }
  return period;
}

/** True when a point lies on a line, or on a lattice translate of it. */
export function isOnLine(line: SymmetryLine, [x, y]: Vec): boolean {
  const off = -Math.sin(line.angle) * x + Math.cos(line.angle) * y - line.offset;
  const part = positiveMod(off, line.period);
  return part < 1e-6 || line.period - part < 1e-6;
}

const elementsCache = new Map<string, SymmetryElements>();

/** Every rotation center, mirror and glide axis of a group, modulo its translations. */
export function symmetryElements(group: WallpaperGroup): SymmetryElements {
  const cacheKey = `${group.id}:${group.cell.width}`;
  const cached = elementsCache.get(cacheKey);
  if (cached) return cached;

  const centers = new Map<string, { order: number; center: Vec }>();
  const lines = new Map<string, GlideLine>();
  const reach = 6;
  for (const op of cosets(group)) {
    if (keyOf(op.slice(0, 4)) === keyOf(IDENTITY.slice(0, 4))) continue;
    for (let i = -reach; i <= reach; i++) {
      for (let j = -reach; j <= reach; j++) {
        const tx = op[4] + i * group.basis[0][0] + j * group.basis[1][0];
        const ty = op[5] + i * group.basis[0][1] + j * group.basis[1][1];
        if (isReflecting(op)) {
          // Half the angle of the linear part is the axis direction. t splits into a slide along it and twice the offset across it.
          let angle = Math.atan2(op[1], op[0]) / 2;
          if (angle < -EPS) angle += Math.PI;
          if (Math.abs(angle - Math.PI) < EPS) angle = 0;
          const normal: Vec = [-Math.sin(angle), Math.cos(angle)];
          const shift = Math.abs(tx * Math.cos(angle) + ty * Math.sin(angle));
          const period = linePeriod(group, normal);
          const offset = positiveMod((tx * normal[0] + ty * normal[1]) / 2, period);
          const key = keyOf([angle, offset]);
          const known = lines.get(key);
          if (!known || shift < known.shift) lines.set(key, { angle, offset, period, shift });
        } else {
          // A rotation's center solves (I - L) c = t.
          const a = 1 - op[0];
          const b = -op[2];
          const c = -op[1];
          const d = 1 - op[3];
          const det = a * d - b * c;
          const center = reduceToLattice(group, [(d * tx - b * ty) / det, (a * ty - c * tx) / det]);
          const order = Math.round((2 * Math.PI) / Math.abs(Math.atan2(op[1], op[0])));
          const key = keyOf(center);
          const known = centers.get(key);
          if (!known || order > known.order) centers.set(key, { order, center });
        }
      }
    }
  }

  const rotations = [...centers.values()];
  const all = [...lines.values()];
  const elements: SymmetryElements = {
    rotations,
    rotationOrders: [...new Set(rotations.map((r) => r.order))].sort((a, b) => a - b),
    mirrors: all.filter((line) => line.shift < 1e-6).map(({ angle, offset, period }) => ({ angle, offset, period })),
    glides: all.filter((line) => line.shift >= 1e-6),
  };
  elementsCache.set(cacheKey, elements);
  return elements;
}

/** Copies in the repeat rectangle: the point group's size times the lattice points in it. */
export const copiesPerCell = (group: WallpaperGroup) => cosets(group).length * cellTranslations(group).length;
