import { describe, expect, it } from "vitest";
import {
  allWallpaperGroups,
  applyAffine,
  cellSymmetries,
  compose,
  copiesPerCell,
  cosets,
  GROUP_IDS,
  invertAffine,
  isLatticeVector,
  isOnLine,
  sameModLattice,
  symmetryElements,
  tileSymmetries,
  translation,
  wallpaperGroup,
  type GroupId,
  type Vec,
} from "./wallpaper";

/** Written out by hand from the standard tables of the 17 groups, not derived from the engine. */
const EXPECTED: Record<GroupId, { rotations: number[]; mirrors: boolean; glides: boolean; pointOrder: number; latticePoints: number; family: string }> = {
  p1: { rotations: [], mirrors: false, glides: false, pointOrder: 1, latticePoints: 3, family: "oblique" },
  p2: { rotations: [2], mirrors: false, glides: false, pointOrder: 2, latticePoints: 3, family: "oblique" },
  pm: { rotations: [], mirrors: true, glides: false, pointOrder: 2, latticePoints: 1, family: "rectangular" },
  pg: { rotations: [], mirrors: false, glides: true, pointOrder: 2, latticePoints: 1, family: "rectangular" },
  cm: { rotations: [], mirrors: true, glides: true, pointOrder: 2, latticePoints: 2, family: "rhombic" },
  pmm: { rotations: [2], mirrors: true, glides: false, pointOrder: 4, latticePoints: 1, family: "rectangular" },
  pmg: { rotations: [2], mirrors: true, glides: true, pointOrder: 4, latticePoints: 1, family: "rectangular" },
  pgg: { rotations: [2], mirrors: false, glides: true, pointOrder: 4, latticePoints: 1, family: "rectangular" },
  cmm: { rotations: [2], mirrors: true, glides: true, pointOrder: 4, latticePoints: 2, family: "rhombic" },
  p4: { rotations: [2, 4], mirrors: false, glides: false, pointOrder: 4, latticePoints: 1, family: "square" },
  p4m: { rotations: [2, 4], mirrors: true, glides: true, pointOrder: 8, latticePoints: 1, family: "square" },
  p4g: { rotations: [2, 4], mirrors: true, glides: true, pointOrder: 8, latticePoints: 1, family: "square" },
  p3: { rotations: [3], mirrors: false, glides: false, pointOrder: 3, latticePoints: 2, family: "hexagonal" },
  p3m1: { rotations: [3], mirrors: true, glides: true, pointOrder: 6, latticePoints: 2, family: "hexagonal" },
  p31m: { rotations: [3], mirrors: true, glides: true, pointOrder: 6, latticePoints: 2, family: "hexagonal" },
  p6: { rotations: [2, 3, 6], mirrors: false, glides: false, pointOrder: 6, latticePoints: 2, family: "hexagonal" },
  p6m: { rotations: [2, 3, 6], mirrors: true, glides: true, pointOrder: 12, latticePoints: 2, family: "hexagonal" },
};

const inside = (polygon: readonly Vec[], [x, y]: Vec, inset: number) => {
  // Convex, in either winding: the point is on the same side of every edge, by at least `inset`.
  const signs = polygon.map(([x0, y0], i) => {
    const [x1, y1] = polygon[(i + 1) % polygon.length];
    return ((x1 - x0) * (y - y0) - (y1 - y0) * (x - x0)) / Math.hypot(x1 - x0, y1 - y0);
  });
  return signs.every((s) => s > inset) || signs.every((s) => s < -inset);
};

const area = (polygon: readonly Vec[]) => Math.abs(polygon.reduce((sum, [x0, y0], i) => {
  const [x1, y1] = polygon[(i + 1) % polygon.length];
  return sum + x0 * y1 - x1 * y0;
}, 0)) / 2;

const orderOf = (m: readonly number[]) => {
  const angle = Math.abs(Math.atan2(m[1], m[0]));
  return angle < 1e-9 ? 1 : Math.round((2 * Math.PI) / angle);
};

// A small repeatable generator, so a failure can be reproduced.
function randomPoints(count: number, width: number, height: number): Vec[] {
  let seed = 12345;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: count }, (): Vec => [next() * width, next() * height]);
}

describe("the catalog", () => {
  it("has exactly the 17 groups, each once", () => {
    expect(GROUP_IDS).toHaveLength(17);
    expect(new Set(GROUP_IDS).size).toBe(17);
    expect(allWallpaperGroups().map((g) => g.id).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("gives each group a different symmetry signature, apart from those told apart by where centers sit", () => {
    const signature = (id: GroupId) => {
      const { rotationOrders, mirrors, glides } = symmetryElements(wallpaperGroup(id));
      return `${rotationOrders}|${mirrors.length > 0}|${glides.length > 0}|${cosets(wallpaperGroup(id)).length}|${wallpaperGroup(id).family}`;
    };
    const signatures = new Map<string, GroupId[]>();
    for (const id of GROUP_IDS) signatures.set(signature(id), [...(signatures.get(signature(id)) ?? []), id]);
    const shared = [...signatures.values()].filter((ids) => ids.length > 1).map((ids) => ids.sort().join());
    expect(shared.sort()).toEqual(["p31m,p3m1", "p4g,p4m", "pmg,cmm".split(",").sort().join()].filter((s) => s !== "cmm,pmg").sort());
  });
});

describe.each(GROUP_IDS)("%s", (id) => {
  const group = wallpaperGroup(id);
  const expected = EXPECTED[id];
  const ops = cosets(group);
  const elements = symmetryElements(group);

  it("has a repeat rectangle whose sides are translations, and only those", () => {
    expect(isLatticeVector(group, [group.cell.width, 0])).toBe(true);
    expect(isLatticeVector(group, [0, group.cell.height])).toBe(true);
    expect(group.family).toBe(expected.family);
    // No shorter upright side.
    for (let k = 2; k <= 6; k++) {
      expect(isLatticeVector(group, [group.cell.width / k, 0]), `width / ${k}`).toBe(false);
      expect(isLatticeVector(group, [0, group.cell.height / k]), `height / ${k}`).toBe(false);
    }
    const primitive = Math.abs(group.basis[0][0] * group.basis[1][1] - group.basis[0][1] * group.basis[1][0]);
    expect((group.cell.width * group.cell.height) / primitive).toBeCloseTo(expected.latticePoints, 9);
  });

  it("has symmetries that are all isometries preserving the lattice", () => {
    for (const op of ops) {
      expect(Math.abs(op[0] * op[3] - op[1] * op[2])).toBeCloseTo(1, 9);
      expect(op[0] * op[0] + op[1] * op[1]).toBeCloseTo(1, 9);
      for (const v of group.basis) {
        const image = applyAffine([op[0], op[1], op[2], op[3], 0, 0], v);
        expect(isLatticeVector(group, image), `${op}`).toBe(true);
      }
    }
  });

  it("closes: every generator maps the symmetries onto themselves, modulo the lattice", () => {
    expect(ops).toHaveLength(expected.pointOrder);
    for (const generator of group.generators) {
      for (const op of ops) {
        const image = compose(generator, op);
        const matches = ops.filter((other) => sameModLattice(group, image, other));
        expect(matches).toHaveLength(1);
      }
    }
    // Distinct symmetries stay distinct, so nothing was double-counted.
    for (let i = 0; i < ops.length; i++) for (let j = i + 1; j < ops.length; j++) expect(sameModLattice(group, ops[i], ops[j])).toBe(false);
  });

  it("has the right rotation orders", () => {
    expect(elements.rotationOrders).toEqual(expected.rotations);
    const fromLinearParts = [...new Set(ops.map(orderOf).filter((o, i) => o > 1 && ops[i][0] * ops[i][3] - ops[i][1] * ops[i][2] > 0))].sort((a, b) => a - b);
    expect(fromLinearParts.at(-1)).toBe(expected.rotations.at(-1));
  });

  it("has mirrors and glides exactly where it should", () => {
    expect(elements.mirrors.length > 0).toBe(expected.mirrors);
    expect(elements.glides.length > 0).toBe(expected.glides);
    // A mirror really fixes its line, and a glide's shift is half a translation along its axis.
    for (const glide of elements.glides) {
      const along: Vec = [2 * glide.shift * Math.cos(glide.angle), 2 * glide.shift * Math.sin(glide.angle)];
      expect(isLatticeVector(group, along), `${id} glide`).toBe(true);
    }
  });

  it("has a domain whose copies fill the plane exactly once", () => {
    const primitive = Math.abs(group.basis[0][0] * group.basis[1][1] - group.basis[0][1] * group.basis[1][0]);
    expect(area(group.domain)).toBeCloseTo(primitive / expected.pointOrder, 9);
    const symmetries = cellSymmetries(group);
    expect(symmetries).toHaveLength(expected.pointOrder * expected.latticePoints);
    expect(copiesPerCell(group)).toBe(symmetries.length);

    // Count the copies over random points. The cell's own lattice is added around each copy, so wrapped pieces count.
    const { width, height } = group.cell;
    let tested = 0;
    for (const point of randomPoints(400, width, height)) {
      let hits = 0;
      let boundary = false;
      for (const op of symmetries) {
        for (let i = -3; i <= 3; i++) {
          for (let j = -3; j <= 3; j++) {
            const back = applyAffine(invertAffine(compose(translation(i * width, j * height), op)), point);
            if (inside(group.domain, back, 1e-6)) hits++;
            else if (inside(group.domain, back, -1e-6)) boundary = true;
          }
        }
      }
      if (boundary) continue;
      tested++;
      expect(hits, `point ${point}`).toBe(1);
    }
    expect(tested).toBeGreaterThan(350);
  });

  it("wraps copies so the tile's translations by the cell map it to itself", () => {
    const { width, height } = group.cell;
    const placed = tileSymmetries(group, group.domain);
    const reaches = (op: (typeof placed)[number]) => {
      const points = group.domain.map((p) => applyAffine(op, p));
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      return Math.max(...xs) > 1e-6 && Math.min(...xs) < width - 1e-6 && Math.max(...ys) > 1e-6 && Math.min(...ys) < height - 1e-6;
    };
    const same = (f: readonly number[], g: readonly number[]) => f.every((v, i) => Math.abs(v - g[i]) < 1e-6);
    for (const op of placed) {
      for (const [dx, dy] of [[width, 0], [-width, 0], [0, height], [0, -height]]) {
        const moved = compose(translation(dx, dy), op);
        if (reaches(moved)) expect(placed.some((other) => same(moved, other)), `${op} by ${dx},${dy}`).toBe(true);
      }
    }
  });

  it("scales without changing its symmetry", () => {
    const big = wallpaperGroup(id, 2.5);
    expect(big.cell.width).toBeCloseTo(group.cell.width * 2.5, 9);
    expect(cosets(big)).toHaveLength(ops.length);
    expect(symmetryElements(big).rotationOrders).toEqual(elements.rotationOrders);
  });
});

describe("groups told apart by where their centers sit", () => {
  const centersOf = (id: GroupId, order: number) => symmetryElements(wallpaperGroup(id)).rotations.filter((r) => r.order === order);
  const mirrored = (id: GroupId, center: Vec) => symmetryElements(wallpaperGroup(id)).mirrors.some((line) => isOnLine(line, center));

  it("p4m has all its 4-fold centers on mirrors; p4g has none", () => {
    expect(centersOf("p4m", 4).every((r) => mirrored("p4m", r.center))).toBe(true);
    expect(centersOf("p4g", 4).some((r) => mirrored("p4g", r.center))).toBe(false);
    expect(centersOf("p4g", 2).every((r) => mirrored("p4g", r.center))).toBe(true);
  });

  it("p3m1 has all its 3-fold centers on mirrors; p31m has some off them", () => {
    expect(centersOf("p3m1", 3).every((r) => mirrored("p3m1", r.center))).toBe(true);
    const onOff = centersOf("p31m", 3).map((r) => mirrored("p31m", r.center));
    expect(onOff.filter(Boolean)).toHaveLength(1);
    expect(onOff.filter((on) => !on)).toHaveLength(2);
  });

  it("pmm has all its 2-fold centers on mirrors; cmm has some off them; pmg has none on them", () => {
    expect(centersOf("pmm", 2).every((r) => mirrored("pmm", r.center))).toBe(true);
    const cmm = centersOf("cmm", 2).map((r) => mirrored("cmm", r.center));
    expect(cmm.some(Boolean)).toBe(true);
    expect(cmm.some((on) => !on)).toBe(true);
    expect(centersOf("pmg", 2).some((r) => mirrored("pmg", r.center))).toBe(false);
  });

  it("has the standard number of rotation centers per lattice cell", () => {
    const count = (id: GroupId) => {
      const tally: Record<number, number> = {};
      for (const { order } of symmetryElements(wallpaperGroup(id)).rotations) tally[order] = (tally[order] ?? 0) + 1;
      return tally;
    };
    expect(count("p2")).toEqual({ 2: 4 });
    expect(count("p4")).toEqual({ 2: 2, 4: 2 });
    expect(count("p3")).toEqual({ 3: 3 });
    expect(count("p6")).toEqual({ 2: 3, 3: 2, 6: 1 });
    expect(count("pgg")).toEqual({ 2: 4 });
    expect(count("p6m")).toEqual({ 2: 3, 3: 2, 6: 1 });
  });

  it("keeps hexagonal repeats at 1 : sqrt(3)", () => {
    for (const id of ["p3", "p3m1", "p31m", "p6", "p6m"] as const) {
      const { width, height } = wallpaperGroup(id).cell;
      expect(height / width).toBeCloseTo(Math.sqrt(3), 12);
    }
  });
});
