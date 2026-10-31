import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  clipPolygon,
  clipSegment,
  generateGirih,
  GIRIH_ANGLE,
  GIRIH_STARS,
  GIRIH_SYMMETRIES,
  GIRIH_TILES,
  girihScene,
  girihShapes,
  girihStencil,
  insetPolygon,
  isSimple,
  polygonArea,
  strapFaces,
  tileCorners,
  tileSegments,
  usableStar,
  type GirihRequest,
  type GirihScene,
  type GirihStar,
  type GirihSymmetry,
  type GirihTile,
} from "./girih";
import { generateGirihPdf } from "./girihPdf";
import engineText from "./messages/girih.json";
import siteText from "../i18n/messages/girih.json";
import { parseGirihState, serializeGirihState, defaultGirihState, STARS_FOR } from "../lib/girihState";
import { isLatticeVector, reduceToLattice, symmetryElements, type Vec } from "./wallpaper";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const OPTIONS: [GirihSymmetry, GirihStar][] = GIRIH_SYMMETRIES.flatMap((n) => GIRIH_STARS.filter((s) => usableStar(n, s) === s).map((s): [GirihSymmetry, GirihStar] => [n, s]));

const base = (symmetry: GirihSymmetry, star: GirihStar): GirihRequest => ({
  symmetry,
  star,
  lineWeight: 4,
  colors: { background: "#ffffff", primary: "#112233", accent: "#445566", line: "#000000" },
  showTiles: false,
  repeatWidth: 6,
  across: 2,
  down: 2,
});

const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mid = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const edgesOf = (polygon: readonly Vec[]) => polygon.map((p, i): [Vec, Vec] => [p, polygon[(i + 1) % polygon.length]]);
const close = (a: Vec, b: Vec, tol = 1e-6) => dist(a, b) < tol;

/** Interior angles of a polygon, whichever way round it's listed. */
function interiorAngles(polygon: readonly Vec[]): number[] {
  const sign = Math.sign(polygonArea(polygon));
  return polygon.map((p, i) => {
    const prev = polygon[(i + polygon.length - 1) % polygon.length];
    const next = polygon[(i + 1) % polygon.length];
    const a = Math.atan2(next[1] - p[1], next[0] - p[0]);
    const b = Math.atan2(prev[1] - p[1], prev[0] - p[0]);
    const turn = ((b - a) * sign * 180) / Math.PI;
    return Math.round(((turn % 360) + 360) % 360);
  });
}

/**
 * A line piece's identity modulo the pattern's translations: its middle, reduced to the
 * lattice, and its direction. A hexagonal lattice's rectangle isn't turned onto itself by a
 * rotation, so the lattice is what has to be used here, not the rectangle.
 */
function segmentKeys(scene: GirihScene, transform: (p: Vec) => Vec = (p) => p): Set<string> {
  const keys = new Set<string>();
  for (const tile of scene.tilesPerRepeat) {
    for (const [a0, b0] of tileSegments(tile)) {
      const a = transform(a0);
      const b = transform(b0);
      const [mx, my] = reduceToLattice(scene.group, mid(a, b));
      let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      if (angle < -1e-6) angle += 180;
      if (angle >= 180 - 1e-6) angle -= 180;
      keys.add(`${Math.round(mx * 1e3) || 0},${Math.round(my * 1e3) || 0},${Math.round(angle * 10) || 0},${Math.round(dist(a, b) * 1e3)}`);
    }
  }
  return keys;
}

const rotateAbout = ([cx, cy]: Vec, order: number) => {
  const t = (2 * Math.PI) / order;
  return ([x, y]: Vec): Vec => [cx + (x - cx) * Math.cos(t) - (y - cy) * Math.sin(t), cy + (x - cx) * Math.sin(t) + (y - cy) * Math.cos(t)];
};

/** Convex pieces, so overlap tests can use separating axes. Only the bowtie needs cutting. */
function convexParts(tile: GirihTile): Vec[][] {
  if (tile.id !== "bowtie") return [tile.polygon];
  const p = tile.polygon;
  return [[p[5], p[0], p[1], p[2]], [p[2], p[3], p[4], p[5]]];
}

function overlap(a: readonly Vec[], b: readonly Vec[]): boolean {
  for (const poly of [a, b]) {
    for (const [p, q] of edgesOf(poly)) {
      const axis: Vec = [q[1] - p[1], p[0] - q[0]];
      const project = (points: readonly Vec[]) => points.map((v) => v[0] * axis[0] + v[1] * axis[1]);
      if (Math.max(...project(a)) <= Math.min(...project(b)) + 1e-6 || Math.max(...project(b)) <= Math.min(...project(a)) + 1e-6) return false;
    }
  }
  return true;
}

const girih = girihScene(10, "star");
const { width: W, height: H } = girih.group.cell;

/** The patch with enough copies around it that every edge of the middle repeat has both sides. */
const shifted = (tile: GirihTile, dx: number, dy: number): Vec[] => tile.polygon.map(([x, y]) => [x + dx, y + dy]);

describe("girih tiles", () => {
  const expected: Record<string, number[]> = {
    decagon: Array<number>(10).fill(144),
    pentagon: Array<number>(5).fill(108),
    bowtie: [72, 72, 216, 72, 72, 216],
    rhombus: [72, 108, 72, 108],
    hexagon: [72, 144, 144, 72, 144, 144],
  };

  it.each(GIRIH_TILES)("%s closes with unit edges and the right angles", (id) => {
    const polygon = tileCorners(id, [1.3, -0.7], 3);
    for (const [a, b] of edgesOf(polygon)) expect(dist(a, b)).toBeCloseTo(1, 9);
    expect(interiorAngles(polygon)).toEqual(expected[id]);
    expect(polygonArea(polygon)).toBeGreaterThan(0);
  });

  it("uses all five tiles in the patch", () => {
    expect(new Set(girih.tilesPerRepeat.map((t) => t.id))).toEqual(new Set(GIRIH_TILES));
    expect(girih.tilesPerRepeat).toHaveLength(8);
  });

  it("keeps every placed tile's edges at length 1 and its angles", () => {
    for (const tile of girih.tiles) {
      for (const [a, b] of edgesOf(tile.polygon)) expect(dist(a, b)).toBeCloseTo(1, 9);
      expect(interiorAngles(tile.polygon).sort()).toEqual([...expected[tile.id]].sort());
    }
  });

  it("fills the repeat: areas add up exactly", () => {
    const area = girih.tilesPerRepeat.reduce((sum, t) => sum + Math.abs(polygonArea(t.polygon)), 0);
    expect(area).toBeCloseTo(W * H, 9);
  });

  it("has no overlaps, even across the repeat's edges", () => {
    const parts = girih.tilesPerRepeat.map((t) => ({ t, parts: convexParts(t) }));
    parts.forEach((a, i) => {
      parts.forEach((b, j) => {
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            if (i === j && dx === 0 && dy === 0) continue;
            for (const pa of a.parts) {
              for (const pb of b.parts) {
                const moved = pb.map(([x, y]): Vec => [x + dx * W, y + dy * H]);
                expect(overlap(pa, moved), `${a.t.id} ${i} and ${b.t.id} ${j} at ${dx},${dy}`).toBe(false);
              }
            }
          }
        }
      });
    });
  });

  it("meets edge to edge: every edge has exactly one neighbor, running the other way", () => {
    const wrap = ([x, y]: Vec) => {
      const f = (v: number, m: number) => {
        const r = ((v % m) + m) % m;
        return m - r < 1e-4 ? 0 : r;
      };
      return `${Math.round(f(x, W) * 1e3) || 0},${Math.round(f(y, H) * 1e3) || 0}`;
    };
    const counts = new Map<string, number>();
    for (const tile of girih.tilesPerRepeat) {
      for (const [a, b] of edgesOf(tile.polygon)) {
        const key = wrap(mid(a, b));
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(counts.size).toBe(girih.tilesPerRepeat.reduce((s, t) => s + t.polygon.length, 0) / 2);
  });

  it("uses only the shared lattice: copies sit one repeat apart", () => {
    const shape = shifted(girih.tilesPerRepeat[0], W, 0);
    expect(shape[0][0] - girih.tilesPerRepeat[0].polygon[0][0]).toBeCloseTo(W, 9);
    expect(H).toBeCloseTo(2 * (0.5 / Math.tan((18 * Math.PI) / 180)), 9);
  });
});

describe("girih strapwork", () => {
  /** Strap ends at an edge's midpoint, as directions pointing away from it. */
  const raysAt = (tile: GirihTile, point: Vec): Vec[] =>
    tileSegments(tile).flatMap(([a, b]): Vec[] => {
      if (close(a, point)) return [[b[0] - a[0], b[1] - a[1]]];
      if (close(b, point)) return [[a[0] - b[0], a[1] - b[1]]];
      return [];
    });

  it("leaves every edge's midpoint at 54 degrees to it, twice, inside every tile", () => {
    for (const tile of girih.tiles) {
      for (const [a, b] of edgesOf(tile.polygon)) {
        const rays = raysAt(tile, mid(a, b));
        expect(rays, tile.id).toHaveLength(2);
        const edgeAngle = Math.atan2(b[1] - a[1], b[0] - a[0]);
        for (const [x, y] of rays) {
          const diff = Math.abs(((Math.atan2(y, x) - edgeAngle) * 180) / Math.PI);
          const folded = Math.min(diff % 180, 180 - (diff % 180));
          expect(folded).toBeCloseTo(GIRIH_ANGLE, 6);
        }
      }
    }
  });

  it("carries each line straight across every edge, crossing at 72 and 108 degrees", () => {
    const around = [-1, 0, 1].flatMap((i) => [-1, 0, 1].flatMap((j) => girih.tilesPerRepeat.map((t) => ({ t, dx: i * W, dy: j * H }))));
    let edges = 0;
    for (const tile of girih.tilesPerRepeat) {
      for (const [a, b] of edgesOf(tile.polygon)) {
        const m = mid(a, b);
        const others = around.filter(({ t, dx, dy }) => !(t === tile && dx === 0 && dy === 0) && edgesOf(shifted(t, dx, dy)).some(([p, q]) => close(mid(p, q), m)));
        expect(others, `edge of ${tile.id}`).toHaveLength(1);
        const { t: other, dx, dy } = others[0];
        const mine = raysAt(tile, m);
        const theirs = raysAt(other, [m[0] - dx, m[1] - dy]);
        expect(theirs).toHaveLength(2);
        // Each of my rays has one of theirs pointing exactly the opposite way.
        for (const [x, y] of mine) {
          const opposite = theirs.filter(([u, v]) => Math.abs(x * v - y * u) / (Math.hypot(x, y) * Math.hypot(u, v)) < 1e-6 && x * u + y * v < 0);
          expect(opposite).toHaveLength(1);
        }
        const [r0, r1] = mine;
        const cos = (r0[0] * r1[0] + r0[1] * r1[1]) / (Math.hypot(...r0) * Math.hypot(...r1));
        const angle = (Math.acos(cos) * 180) / Math.PI;
        expect(Math.min(angle, 180 - angle)).toBeCloseTo(72, 6);
        edges++;
      }
    }
    expect(edges).toBe(girih.tilesPerRepeat.reduce((s, t) => s + t.polygon.length, 0));
  });

  it("stays inside its tile", () => {
    for (const tile of girih.tilesPerRepeat) {
      const area = Math.abs(polygonArea(tile.polygon));
      for (const loop of tile.loops) {
        for (const point of loop) {
          // Fanning a point to every edge covers the tile exactly once if the point is inside or on it.
          const fan = edgesOf(tile.polygon).reduce((sum, [a, b]) => sum + polygonArea([point, a, b]), 0);
          expect(Math.abs(fan)).toBeCloseTo(area, 9);
          if (tile.id !== "bowtie") {
            for (const [a, b] of edgesOf(tile.polygon)) {
              const side = polygonArea([a, b, point]) * Math.sign(polygonArea(tile.polygon));
              expect(side).toBeGreaterThanOrEqual(-1e-9);
            }
          }
        }
      }
    }
  });

  it("the rosette's decagon lines are the straight chords joining every third midpoint", () => {
    const scene = girihScene(10, "rosette");
    const decagon = scene.tilesPerRepeat.find((t) => t.id === "decagon")!;
    const mids = edgesOf(decagon.polygon).map(([a, b]) => mid(a, b));
    for (const [a, b] of [...tileSegments(decagon)]) {
      const onChord = mids.some((m, i) => {
        const n = mids[(i + 3) % 10];
        const along = (p: Vec) => Math.abs((n[0] - m[0]) * (p[1] - m[1]) - (n[1] - m[1]) * (p[0] - m[0]));
        return along(a) < 1e-9 && along(b) < 1e-9;
      });
      expect(onChord).toBe(true);
    }
  });
});

describe.each(OPTIONS)("%i-fold %s", (symmetry, star) => {
  const scene = girihScene(symmetry, star);
  const { width, height } = scene.group.cell;
  const elements = symmetryElements(scene.group);

  it("maps its lines onto themselves under every rotation center it claims", () => {
    const base0 = segmentKeys(scene);
    expect(elements.rotations.length).toBeGreaterThan(0);
    for (const { order, center } of elements.rotations) {
      expect([...segmentKeys(scene, rotateAbout(center, order))].sort()).toEqual([...base0].sort());
    }
  });

  it("maps its lines onto themselves under every mirror it claims", () => {
    const base0 = segmentKeys(scene);
    for (const line of elements.mirrors) {
      const nx = -Math.sin(line.angle);
      const ny = Math.cos(line.angle);
      const reflect = ([x, y]: Vec): Vec => {
        const d = nx * x + ny * y - line.offset;
        return [x - 2 * d * nx, y - 2 * d * ny];
      };
      expect([...segmentKeys(scene, reflect)].sort()).toEqual([...base0].sort());
    }
  });

  it("repeats: the rectangle's sides are translations, and its tiles fill it exactly once", () => {
    expect(isLatticeVector(scene.group, [width, 0])).toBe(true);
    expect(isLatticeVector(scene.group, [0, height])).toBe(true);
    const area = scene.tilesPerRepeat.reduce((sum, t) => sum + Math.abs(polygonArea(t.polygon)), 0);
    expect(area).toBeCloseTo(width * height, 9);
  });

  it("doesn't overclaim: the pattern has the order it reports and not the star's, when those differ", () => {
    const { rotationOrder } = generateGirih(base(symmetry, star));
    expect(rotationOrder).toBe(symmetry === 10 ? 2 : symmetry === 4 || symmetry === 8 ? 4 : 6);
    if (symmetry !== rotationOrder) {
      const center = scene.tilesPerRepeat.find((t) => t.main)!.center;
      expect(segmentKeys(scene, rotateAbout(center, symmetry))).not.toEqual(segmentKeys(scene));
    }
  });

  it("is seamless: every line touching one edge of the repeat touches the opposite edge at the same place", () => {
    const hits = (axis: 0 | 1, target: number) => {
      const found = new Set<string>();
      for (const tile of scene.tiles) {
        for (const [a, b] of tileSegments(tile)) {
          const da = a[axis] - target;
          const db = b[axis] - target;
          // Lines along the edge itself don't cross it.
          if (da * db > 1e-12 || Math.abs(a[axis] - b[axis]) < 1e-9) continue;
          const t = da / (da - db);
          const along = a[1 - axis] + (b[1 - axis] - a[1 - axis]) * t;
          const limit = axis === 0 ? height : width;
          if (along < -1e-9 || along > limit + 1e-9) continue;
          const dir = Math.round((((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 360) % 180) * 10) % 1800;
          found.add(`${along.toFixed(4)}@${dir}`);
        }
      }
      return [...found].sort();
    };
    expect(hits(0, width)).toEqual(hits(0, 0));
    expect(hits(1, height)).toEqual(hits(1, 0));
    expect(hits(0, 0).length + hits(1, 0).length).toBeGreaterThan(0);
  });

  it("draws every tile that reaches the repeat", () => {
    for (const tile of scene.tilesPerRepeat) {
      for (const [dx, dy] of [[width, 0], [-width, 0], [0, height], [0, -height]]) {
        const copy = tile.polygon.map(([x, y]): Vec => [x + dx, y + dy]);
        const reaches = clipPolygon(copy, 0, 0, width, height);
        if (reaches.length > 2 && Math.abs(polygonArea(reaches)) > 1e-6) {
          const center: Vec = [tile.center[0] + dx, tile.center[1] + dy];
          expect(scene.tiles.some((t) => t.id === tile.id && close(t.center, center))).toBe(true);
        }
      }
    }
  });

  it("closes its stars, with the right number of points", () => {
    for (const tile of scene.tilesPerRepeat) {
      if (tile.star === null) continue;
      const [loop] = tile.loops;
      expect(tile.loops).toHaveLength(1);
      expect(loop).toHaveLength(tile.star * 2);
      expect(isSimple(loop)).toBe(true);
      expect(Math.abs(polygonArea(loop))).toBeGreaterThan(0);
      // Tips and notches alternate: tips far from the center, notches near it.
      const radii = loop.map((p) => dist(p, tile.center));
      for (let i = 0; i < loop.length; i += 2) expect(radii[i]).toBeLessThan(radii[i + 1]);
      // Turning the star by one point lands it on itself.
      const turned = loop.map(rotateAbout(tile.center, tile.star));
      for (const p of turned) expect(loop.some((q) => close(p, q, 1e-9))).toBe(true);
    }
    expect(scene.tilesPerRepeat.some((t) => t.main && t.star === symmetry)).toBe(true);
  });

  it("draws lines that only ever touch at their ends", () => {
    const segments = scene.tilesPerRepeat.flatMap(tileSegments);
    const side = (p: Vec, q: Vec, r: Vec) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    segments.forEach(([a, b], i) => {
      segments.slice(i + 1).forEach(([c, d]) => {
        const crosses = side(a, b, c) * side(a, b, d) < -1e-9 && side(c, d, a) * side(c, d, b) < -1e-9;
        expect(crosses).toBe(false);
      });
    });
  });

  describe("stencil", () => {
    const stencil = girihStencil({ symmetry, star, lineWeight: 4 });

    it("keeps openings apart by at least the bridge, and inside the frame", () => {
      const pointToSegment = (p: Vec, a: Vec, b: Vec) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
        return dist(p, [a[0] + t * dx, a[1] + t * dy]);
      };
      stencil.openings.forEach((a, i) => {
        expect(isSimple(a)).toBe(true);
        for (const [x, y] of a) {
          expect(x).toBeGreaterThanOrEqual(stencil.frame - 1e-9);
          expect(y).toBeGreaterThanOrEqual(stencil.frame - 1e-9);
          expect(x).toBeLessThanOrEqual(stencil.width - stencil.frame + 1e-9);
          expect(y).toBeLessThanOrEqual(stencil.height - stencil.frame + 1e-9);
        }
        stencil.openings.slice(i + 1).forEach((b) => {
          for (const p of a) for (const [q, r] of edgesOf(b)) expect(pointToSegment(p, q, r)).toBeGreaterThan(stencil.bridge - 1e-6);
          for (const p of b) for (const [q, r] of edgesOf(a)) expect(pointToSegment(p, q, r)).toBeGreaterThan(stencil.bridge - 1e-6);
        });
      });
    });

    it("stays in one piece: all the sheet's material connects to the frame", () => {
      // Flood fill on a grid fine enough to see the narrowest bridge.
      const step = stencil.bridge / 3;
      const cols = Math.ceil(stencil.width / step);
      const rows = Math.ceil(stencil.height / step);
      const holes = [...stencil.openings, ...stencil.marks].map((polygon) => {
        const xs = polygon.map(([x]) => x);
        const ys = polygon.map(([, y]) => y);
        return { polygon, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
      });
      const inside = (x: number, y: number, polygon: Vec[]) => {
        let hit = false;
        polygon.forEach(([x0, y0], i) => {
          const [x1, y1] = polygon[(i + 1) % polygon.length];
          if (y0 > y !== y1 > y && x < x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)) hit = !hit;
        });
        return hit;
      };
      const solid = new Uint8Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * step;
          const y = (r + 0.5) * step;
          const cut = holes.some((h) => x >= h.minX && x <= h.maxX && y >= h.minY && y <= h.maxY && inside(x, y, h.polygon));
          solid[r * cols + c] = cut ? 0 : 1;
        }
      }
      const queue = [0];
      const seen = new Uint8Array(cols * rows);
      seen[0] = 1;
      while (queue.length) {
        const at = queue.pop()!;
        const r = Math.floor(at / cols);
        const c = at % cols;
        for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          const next = nr * cols + nc;
          if (solid[next] && !seen[next]) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
      let orphans = 0;
      for (let i = 0; i < solid.length; i++) if (solid[i] && !seen[i]) orphans++;
      expect(orphans).toBe(0);
      expect(solid.reduce((s, v) => s + v, 0)).toBeLessThan(solid.length);
    });

    it("paints each region once when moved a repeat at a time", () => {
      const centers = stencil.openings.map((poly) => {
        const c = poly.reduce((s, p) => [s[0] + p[0], s[1] + p[1]] as Vec, [0, 0] as Vec);
        return [c[0] / poly.length, c[1] / poly.length] as Vec;
      });
      const wrapped = centers.map(([x, y]) => {
        const f = (v: number, m: number) => {
          const r = ((v % m) + m) % m;
          return m - r < 1e-3 ? 0 : r;
        };
        return `${f(x, stencil.repeatWidth).toFixed(3)},${f(y, stencil.repeatHeight).toFixed(3)}`;
      });
      expect(new Set(wrapped).size).toBe(wrapped.length);
      expect(stencil.openings.length).toBeGreaterThan(1);
    });

    it("sets its alignment holes exactly one repeat apart, clear of the openings", () => {
      const [a, b, c, d] = stencil.marks.map((m) => m.reduce((s, p) => [s[0] + p[0] / m.length, s[1] + p[1] / m.length] as Vec, [0, 0] as Vec));
      expect(b[0] - a[0]).toBeCloseTo(stencil.repeatWidth, 9);
      expect(b[1]).toBeCloseTo(a[1], 9);
      expect(d[1] - c[1]).toBeCloseTo(stencil.repeatHeight, 9);
      expect(d[0]).toBeCloseTo(c[0], 9);
      for (const mark of stencil.marks) {
        for (const [x, y] of mark) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(stencil.width);
          expect(y).toBeLessThanOrEqual(stencil.height);
        }
      }
    });

    it("covers nearly all regions of the repeat, losing only tiny ones", () => {
      const scene2 = girihScene(symmetry, star);
      const faces = strapFaces(scene2.tilesPerRepeat.flatMap((t) => [t]));
      expect(faces.length).toBeGreaterThan(0);
      expect(stencil.openings.length).toBeGreaterThanOrEqual(scene2.tilesPerRepeat.length);
    });
  });
});

describe("inset", () => {
  it("moves a square's sides in", () => {
    const inset = insetPolygon([[0, 0], [2, 0], [2, 2], [0, 2]], 0.5)!;
    expect(polygonArea(inset)).toBeCloseTo(1, 9);
  });
  it("gives up on a shape too small for it", () => {
    expect(insetPolygon([[0, 0], [1, 0], [1, 1], [0, 1]], 0.6)).toBeNull();
  });
});

describe("files", () => {
  it.each(OPTIONS)("%i-fold %s has a matching viewBox and size", (symmetry, star) => {
    const result = generateGirih(base(symmetry, star));
    const box = /viewBox="0 0 ([\d.]+) ([\d.]+)" width="([\d.]+)in" height="([\d.]+)in"/;
    for (const svg of Object.values(result.svg)) {
      const [, w, h, wi, hi] = box.exec(svg)!;
      expect(Number(w) / Number(h)).toBeCloseTo(Number(wi) / Number(hi), 2);
    }
    expect(result.svg.repeat).not.toMatch(/undefined|NaN/);
    expect(result.svg.panel).not.toMatch(/undefined|NaN/);
    expect(result.svg.stencil).not.toMatch(/undefined|NaN/);
  });

  it("says girih only for the five-tile patch", () => {
    for (const locale of LOCALES) {
      for (const [symmetry, star] of OPTIONS) {
        const result = generateGirih({ ...base(symmetry, star), locale });
        expect(result.isGirih).toBe(symmetry === 10);
        if (symmetry !== 10) expect(JSON.stringify(result), `${locale} ${symmetry} ${star}`).not.toMatch(/girih/i);
      }
    }
  });

  it("counts all five tiles, and the true sizes", () => {
    const result = generateGirih(base(10, "star"));
    expect(result.parts.map((p) => [p.id, p.count]).sort()).toEqual([["bowtie", 1], ["decagon", 2], ["hexagon", 1], ["pentagon", 2], ["rhombus", 2]]);
    expect(result.width).toBe("6");
    const hex = generateGirih(base(6, "star"));
    expect(hex.parts).toEqual([{ id: "star6", name: "6-point star", count: 2 }]);
    expect(generateGirih(base(12, "star")).parts.find((p) => p.id === "star3")?.count).toBe(4);
  });

  it("draws tile edges only when asked", () => {
    const scene = girihScene(10, "star");
    expect(girihShapes(base(10, "star"), scene)).toHaveLength(3);
    expect(girihShapes({ ...base(10, "star"), showTiles: true }, scene)).toHaveLength(4);
  });

  it("clips polygons and lines to the rectangle", () => {
    expect(Math.abs(polygonArea(clipPolygon([[-1, -1], [1, -1], [1, 1], [-1, 1]], 0, 0, 2, 2)))).toBeCloseTo(1, 9);
    expect(clipSegment([[-1, 1], [3, 1]], 0, 0, 2, 2)).toEqual([[0, 1], [2, 1]]);
    expect(clipSegment([[-1, 3], [3, 3]], 0, 0, 2, 2)).toBeNull();
  });

  it.each(LOCALES)("builds a %s PDF for every option", async (locale) => {
    for (const [symmetry, star] of OPTIONS) {
      const doc = await PDFDocument.load(await generateGirihPdf({ ...base(symmetry, star), locale }));
      expect(doc.getPageCount()).toBe(4);
    }
    const result = generateGirih({ ...base(10, "rosette"), locale });
    expect(JSON.stringify([result.steps, result.notes, result.parts])).not.toMatch(/\{\w+\}/);
  });

  it("keeps the same geometry in every language", () => {
    const strip = (svg: string) => svg.replace(/<title>.*?<\/title>/, "");
    const en = generateGirih(base(10, "star"));
    for (const locale of LOCALES) expect(strip(generateGirih({ ...base(10, "star"), locale }).svg.repeat)).toBe(strip(en.svg.repeat));
  });
});

type Tree = { [key: string]: string | Tree };
const flatten = (tree: Tree, prefix = ""): [string, string][] => Object.entries(tree).flatMap(([k, v]): [string, string][] => (typeof v === "string" ? [[prefix + k, v]] : flatten(v, `${prefix}${k}.`)));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe.each([["engine", engineText], ["site", siteText]] as const)("%s translations", (_, catalog) => {
  const english = new Map(flatten(catalog.en as unknown as Tree));
  it.each(LOCALES)("%s has the same keys and placeholders as English", (locale) => {
    const entries = flatten(catalog[locale] as unknown as Tree);
    expect(entries.map(([k]) => k).sort()).toEqual([...english.keys()].sort());
    for (const [key, value] of entries) {
      expect(value, key).not.toBe("");
      expect(placeholders(value), key).toEqual(placeholders(english.get(key)!));
    }
  });
});

describe("PDF text", () => {
  // Helvetica in a PDF can only show WinAnsi characters.
  const WIN_ANSI = /^[ -~ -ÿ–—‘’“”•…Œœ]*$/;
  it.each(LOCALES)("%s engine text is WinAnsi-safe", (locale) => {
    for (const [key, value] of flatten(engineText[locale] as unknown as Tree)) expect(WIN_ANSI.test(value), key).toBe(true);
  });
});

describe("share links", () => {
  const params = (query: string) => new URLSearchParams(query);

  it.each(LOCALES)("%s defaults leave an empty query", (locale) => {
    expect(serializeGirihState(defaultGirihState(locale))).toBe("");
    expect(parseGirihState(params(""), locale)).toEqual(defaultGirihState(locale));
  });

  it("round trips every setting", () => {
    const state: GirihRequest = { symmetry: 12, star: "sharp", lineWeight: 8, colors: { background: "#010203", primary: "#040506", accent: "#070809", line: "#0a0b0c" }, showTiles: true, repeatWidth: 12, across: 5, down: 2 };
    expect(parseGirihState(params(serializeGirihState(state)))).toEqual(state);
  });

  it("round trips every symmetry and star it offers", () => {
    for (const symmetry of GIRIH_SYMMETRIES) {
      for (const star of STARS_FOR[symmetry]) {
        const state = { ...defaultGirihState(), symmetry, star };
        expect(parseGirihState(params(serializeGirihState(state)))).toEqual(state);
      }
    }
  });

  it("falls back on bad input", () => {
    const fallback = defaultGirihState();
    expect(parseGirihState(params("n=7&star=nope&weight=999&c=zzz&w=-1&x=0&y=abc&tiles=2"))).toEqual(fallback);
    expect(parseGirihState(params("n=&weight=&w="))).toEqual(fallback);
    expect(parseGirihState(params("c=112233-445566"))).toEqual(fallback);
  });

  it("won't keep a sharp star on the girih option", () => {
    expect(parseGirihState(params("n=10&star=sharp")).star).toBe("star");
    expect(parseGirihState(params("n=8&star=sharp")).star).toBe("sharp");
  });
});
