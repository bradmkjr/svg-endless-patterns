/**
 * The block catalog. Every block is a list of piecing units on a square grid,
 * so geometry, cutting lists, templates and exports all derive from this one
 * description — nothing is drawn by hand.
 *
 * Only traditional names belong here, and no catalog numbers. Summaries
 * describe the construction; history goes in only with a documented source.
 */

export type Corner = "nw" | "ne" | "se" | "sw";
export type Direction = "up" | "right" | "down" | "left";

export type Unit =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fabric: string }
  /** Half-square triangle: fabric `a` fills `corner`, `b` the other half. */
  | { kind: "hst"; x: number; y: number; size: number; corner: Corner; a: string; b: string }
  /** Quarter-square triangle: one fabric per side. */
  | { kind: "qst"; x: number; y: number; size: number; n: string; e: string; s: string; w: string }
  /** Flying geese: the large triangle's tip points `point`; `w`:`h` is 2:1 or 1:2. */
  | { kind: "goose"; x: number; y: number; w: number; h: number; point: Direction; goose: string; sky: string }
  /** Square in a square: a center on point, with a triangle on each side. */
  | { kind: "sis"; x: number; y: number; size: number; center: string; corners: string };

export type Fabric = { id: string; label: string };
export type Family = "Squares & strips" | "Triangles" | "Stars";

export type Block = {
  slug: string;
  name: string;
  family: Family;
  level: "Beginner" | "Confident beginner" | "Intermediate";
  grid: number;
  fabrics: Fabric[];
  units: Unit[];
  summary: string;
  /** How the finished units go together, after the units themselves are made. */
  assembly: string;
};

const sq = (x: number, y: number, fabric: string, size = 1): Unit => ({ kind: "rect", x, y, w: size, h: size, fabric });
const rect = (x: number, y: number, w: number, h: number, fabric: string): Unit => ({ kind: "rect", x, y, w, h, fabric });
const hst = (x: number, y: number, corner: Corner, a: string, b: string, size = 1): Unit => ({ kind: "hst", x, y, size, corner, a, b });
const qst = (x: number, y: number, n: string, e: string, s: string, w: string, size = 1): Unit => ({ kind: "qst", x, y, size, n, e, s, w });
const goose = (x: number, y: number, w: number, h: number, point: Direction, g: string, sky: string): Unit => ({ kind: "goose", x, y, w, h, point, goose: g, sky });

const NEXT_CORNER: Record<Corner, Corner> = { nw: "ne", ne: "se", se: "sw", sw: "nw" };

/** The unit turned a quarter clockwise about the center of a `grid`-wide block. */
function turn(unit: Unit, grid: number): Unit {
  if (unit.kind === "rect") return { ...unit, x: grid - unit.y - unit.h, y: unit.x, w: unit.h, h: unit.w };
  if (unit.kind === "hst") return { ...unit, x: grid - unit.y - unit.size, y: unit.x, corner: NEXT_CORNER[unit.corner] };
  throw new Error(`turn: unsupported unit ${unit.kind}`);
}

/** The units repeated at all four quarter turns. */
function fourWay(units: Unit[], grid: number): Unit[] {
  const out = [...units];
  let current = units;
  for (let i = 0; i < 3; i++) {
    current = current.map((u) => turn(u, grid));
    out.push(...current);
  }
  return out;
}

const checker = (x: number, y: number, n: number, a: string, b: string): Unit[] => {
  const out: Unit[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push(sq(x + i, y + j, (i + j) % 2 === 0 ? a : b));
  return out;
};

const LIGHT_DARK: Fabric[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const BLOCKS: Block[] = [
  {
    slug: "four-patch",
    name: "Four Patch",
    family: "Squares & strips",
    level: "Beginner",
    grid: 2,
    fabrics: LIGHT_DARK,
    units: checker(0, 0, 2, "dark", "light"),
    summary: "Two rows of two squares in alternating fabrics: the smallest pieced block, and a good first project.",
    assembly: "Sew the squares into two rows, press toward the dark fabric, then join the rows, nesting the center seam.",
  },
  {
    slug: "nine-patch",
    name: "Nine Patch",
    family: "Squares & strips",
    level: "Beginner",
    grid: 3,
    fabrics: LIGHT_DARK,
    units: checker(0, 0, 3, "dark", "light"),
    summary: "Three rows of three squares in a checkerboard, with the dark fabric at the corners and center.",
    assembly: "Sew the squares into three rows, press toward the dark fabric, then join the rows, nesting the seams.",
  },
  {
    slug: "checkerboard",
    name: "Checkerboard",
    family: "Squares & strips",
    level: "Beginner",
    grid: 4,
    fabrics: LIGHT_DARK,
    units: checker(0, 0, 4, "dark", "light"),
    summary: "Four rows of four squares. It makes a busy all-over texture when blocks are set side by side.",
    assembly: "Sew the squares into four rows, pressing each row the opposite way from the last, then join the rows.",
  },
  {
    slug: "double-four-patch",
    name: "Double Four Patch",
    family: "Squares & strips",
    level: "Beginner",
    grid: 4,
    fabrics: [...LIGHT_DARK, { id: "plain", label: "Plain squares" }],
    units: [...checker(0, 0, 2, "dark", "light"), sq(2, 0, "plain", 2), sq(0, 2, "plain", 2), ...checker(2, 2, 2, "dark", "light")],
    summary: "Two small four patches alternate with two plain squares of the same size, forming a strong diagonal.",
    assembly: "Make two four patches, sew each to a plain square to form two rows, then join the rows with the four patches on the diagonal.",
  },
  {
    slug: "double-nine-patch",
    name: "Double Nine Patch",
    family: "Squares & strips",
    level: "Confident beginner",
    grid: 9,
    fabrics: [...LIGHT_DARK, { id: "plain", label: "Plain squares" }],
    units: [
      ...[[0, 0], [6, 0], [3, 3], [0, 6], [6, 6]].flatMap(([x, y]) => checker(x, y, 3, "dark", "light")),
      sq(3, 0, "plain", 3),
      sq(0, 3, "plain", 3),
      sq(6, 3, "plain", 3),
      sq(3, 6, "plain", 3),
    ],
    summary: "A nine patch made of nine patches: five small pieced units alternate with four plain squares.",
    assembly: "Make five small nine patches, lay them out with the plain squares in three rows, sew the rows, then join them.",
  },
  {
    slug: "rail-fence",
    name: "Rail Fence",
    family: "Squares & strips",
    level: "Beginner",
    grid: 6,
    fabrics: [
      { id: "outer", label: "Outer rail" },
      { id: "middle", label: "Middle rail" },
      { id: "inner", label: "Inner rail" },
    ],
    units: [
      rect(0, 0, 1, 3, "outer"), rect(1, 0, 1, 3, "middle"), rect(2, 0, 1, 3, "inner"),
      rect(3, 0, 3, 1, "outer"), rect(3, 1, 3, 1, "middle"), rect(3, 2, 3, 1, "inner"),
      rect(0, 3, 3, 1, "outer"), rect(0, 4, 3, 1, "middle"), rect(0, 5, 3, 1, "inner"),
      rect(3, 3, 1, 3, "outer"), rect(4, 3, 1, 3, "middle"), rect(5, 3, 1, 3, "inner"),
    ],
    summary: "Four sets of three strips, each set turned a quarter from its neighbor, so the rails appear to zigzag.",
    assembly: "Sew the strips into four three-strip squares, turn them as shown, sew them into two rows, then join the rows.",
  },
  {
    slug: "brick-wall",
    name: "Brick Wall",
    family: "Squares & strips",
    level: "Beginner",
    grid: 4,
    fabrics: [
      { id: "a", label: "Brick A" },
      { id: "b", label: "Brick B" },
      { id: "c", label: "Brick C" },
    ],
    units: [
      rect(0, 0, 2, 1, "a"), rect(2, 0, 2, 1, "b"),
      sq(0, 1, "c"), rect(1, 1, 2, 1, "a"), sq(3, 1, "c"),
      rect(0, 2, 2, 1, "b"), rect(2, 2, 2, 1, "c"),
      sq(0, 3, "a"), rect(1, 3, 2, 1, "b"), sq(3, 3, "a"),
    ],
    summary: "Staggered rows of rectangles with half-bricks at the ends. There are no matching seams to worry about.",
    assembly: "Sew the pieces into four rows, then join the rows, keeping the outer edges aligned.",
  },
  {
    slug: "trip-around-the-world",
    name: "Trip Around the World",
    family: "Squares & strips",
    level: "Confident beginner",
    grid: 7,
    fabrics: [
      { id: "center", label: "Center ring" },
      { id: "second", label: "Second ring" },
      { id: "third", label: "Third ring" },
      { id: "fourth", label: "Fourth ring" },
    ],
    units: Array.from({ length: 49 }, (_, n) => {
      const x = n % 7;
      const y = Math.floor(n / 7);
      const ring = (Math.abs(x - 3) + Math.abs(y - 3)) % 4;
      return sq(x, y, ["center", "second", "third", "fourth"][ring]);
    }),
    summary: "Squares arranged in diamond-shaped rings that spread out from the center, cycling through four fabrics.",
    assembly: "Lay out all seven rows before sewing, because the color order shifts in each row, then sew the rows and join them.",
  },
  {
    slug: "hourglass",
    name: "Hourglass",
    family: "Triangles",
    level: "Confident beginner",
    grid: 1,
    fabrics: LIGHT_DARK,
    units: [qst(0, 0, "dark", "light", "dark", "light")],
    summary: "Four triangles meeting at the center, with the same fabric on opposite sides.",
    assembly: "The single quarter-square triangle unit is the finished block.",
  },
  {
    slug: "pinwheel",
    name: "Pinwheel",
    family: "Triangles",
    level: "Beginner",
    grid: 2,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "blade", label: "Blades" },
    ],
    units: [hst(0, 0, "sw", "blade", "ground"), hst(1, 0, "nw", "blade", "ground"), hst(1, 1, "ne", "blade", "ground"), hst(0, 1, "se", "blade", "ground")],
    summary: "Four half-square triangle units, each turned a quarter, so the blades appear to spin around the center.",
    assembly: "Arrange the four units so the blades chase each other, sew them into two rows, then join the rows, matching the center points.",
  },
  {
    slug: "square-in-a-square",
    name: "Square in a Square",
    family: "Triangles",
    level: "Confident beginner",
    grid: 1,
    fabrics: [
      { id: "center", label: "Center" },
      { id: "corners", label: "Corners" },
    ],
    units: [{ kind: "sis", x: 0, y: 0, size: 1, center: "center", corners: "corners" }],
    summary: "A center square set on point, with a triangle on each side to square it up.",
    assembly: "The single square-in-a-square unit is the finished block.",
  },
  {
    slug: "shoo-fly",
    name: "Shoo Fly",
    family: "Triangles",
    level: "Beginner",
    grid: 3,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "fly", label: "Fly" },
    ],
    units: [
      hst(0, 0, "se", "fly", "ground"), sq(1, 0, "ground"), hst(2, 0, "sw", "fly", "ground"),
      sq(0, 1, "ground"), sq(1, 1, "fly"), sq(2, 1, "ground"),
      hst(0, 2, "ne", "fly", "ground"), sq(1, 2, "ground"), hst(2, 2, "nw", "fly", "ground"),
    ],
    summary: "A nine-patch layout with half-square triangles at the corners, which form an X through the center square.",
    assembly: "Lay out the units with the triangles pointing at the center, sew them into three rows, then join the rows.",
  },
  {
    slug: "churn-dash",
    name: "Churn Dash",
    family: "Triangles",
    level: "Beginner",
    grid: 6,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "dash", label: "Dash" },
    ],
    units: [
      hst(0, 0, "se", "dash", "ground", 2), hst(4, 0, "sw", "dash", "ground", 2),
      hst(0, 4, "ne", "dash", "ground", 2), hst(4, 4, "nw", "dash", "ground", 2),
      rect(2, 0, 2, 1, "ground"), rect(2, 1, 2, 1, "dash"),
      rect(2, 4, 2, 1, "dash"), rect(2, 5, 2, 1, "ground"),
      rect(0, 2, 1, 2, "ground"), rect(1, 2, 1, 2, "dash"),
      rect(4, 2, 1, 2, "dash"), rect(5, 2, 1, 2, "ground"),
      sq(2, 2, "ground", 2),
    ],
    summary: "Corner triangles and two-strip side units frame a plain center square.",
    assembly: "Sew each pair of strips into a square, lay out the units with the dash strips next to the center, sew three rows, then join them.",
  },
  {
    slug: "jacobs-ladder",
    name: "Jacob's Ladder",
    family: "Triangles",
    level: "Confident beginner",
    grid: 6,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "rung", label: "Ladder squares" },
      { id: "corner", label: "Large triangles" },
    ],
    units: [
      ...[[0, 0], [4, 0], [2, 2], [0, 4], [4, 4]].flatMap(([x, y]) => checker(x, y, 2, "rung", "ground")),
      hst(2, 0, "ne", "corner", "ground", 2),
      hst(4, 2, "se", "corner", "ground", 2),
      hst(2, 4, "sw", "corner", "ground", 2),
      hst(0, 2, "nw", "corner", "ground", 2),
    ],
    summary: "Five four patches and four large half-square triangles alternate to create crossing diagonal chains.",
    assembly: "Make five four patches, then lay them out with the triangle units in three rows, sew the rows, and join them.",
  },
  {
    slug: "friendship-star",
    name: "Friendship Star",
    family: "Stars",
    level: "Beginner",
    grid: 3,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "star", label: "Star" },
    ],
    units: [
      sq(0, 0, "ground"), hst(1, 0, "sw", "star", "ground"), sq(2, 0, "ground"),
      hst(0, 1, "se", "star", "ground"), sq(1, 1, "star"), hst(2, 1, "nw", "star", "ground"),
      sq(0, 2, "ground"), hst(1, 2, "ne", "star", "ground"), sq(2, 2, "ground"),
    ],
    summary: "Four half-square triangles spin around a center square to make a simple four-pointed star.",
    assembly: "Lay out the units with each point turned a quarter from the last, sew them into three rows, then join the rows.",
  },
  {
    slug: "ohio-star",
    name: "Ohio Star",
    family: "Stars",
    level: "Confident beginner",
    grid: 3,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "star", label: "Star points" },
      { id: "center", label: "Center" },
    ],
    units: [
      sq(0, 0, "ground"), qst(1, 0, "ground", "star", "ground", "star"), sq(2, 0, "ground"),
      qst(0, 1, "star", "ground", "star", "ground"), sq(1, 1, "center"), qst(2, 1, "star", "ground", "star", "ground"),
      sq(0, 2, "ground"), qst(1, 2, "ground", "star", "ground", "star"), sq(2, 2, "ground"),
    ],
    summary: "An eight-pointed star built from four quarter-square triangle units around a center square.",
    assembly: "Lay out the units with the star points touching the center square, sew them into three rows, then join the rows.",
  },
  {
    slug: "sawtooth-star",
    name: "Sawtooth Star",
    family: "Stars",
    level: "Confident beginner",
    grid: 4,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "star", label: "Star points" },
      { id: "center", label: "Center" },
    ],
    units: [
      sq(0, 0, "ground"), goose(1, 0, 2, 1, "down", "ground", "star"), sq(3, 0, "ground"),
      goose(0, 1, 1, 2, "right", "ground", "star"), sq(1, 1, "center", 2), goose(3, 1, 1, 2, "left", "ground", "star"),
      sq(0, 3, "ground"), goose(1, 3, 2, 1, "up", "ground", "star"), sq(3, 3, "ground"),
    ],
    summary: "A large center square surrounded by four flying geese units whose small triangles form the star points.",
    assembly: "Sew a geese unit to the left and right of the center, add a corner square to each end of the other two geese units, then join the three rows.",
  },
  {
    slug: "flying-geese",
    name: "Flying Geese",
    family: "Triangles",
    level: "Confident beginner",
    grid: 4,
    fabrics: [
      { id: "sky", label: "Sky" },
      { id: "goose", label: "Geese" },
    ],
    units: [0, 2].flatMap((x) => [0, 1, 2, 3].map((y) => goose(x, y, 2, 1, "up", "goose", "sky"))),
    summary: "Two columns of four 2:1 units, each a large triangle flanked by two smaller ones.",
    assembly: "Stack the units into two columns with the tips pointing the same way, sew each column, then join the columns.",
  },
  {
    slug: "dutchmans-puzzle",
    name: "Dutchman's Puzzle",
    family: "Triangles",
    level: "Intermediate",
    grid: 4,
    fabrics: [
      { id: "sky", label: "Background" },
      { id: "goose", label: "Geese" },
    ],
    units: [
      goose(0, 0, 2, 1, "up", "goose", "sky"), goose(0, 1, 2, 1, "up", "goose", "sky"),
      goose(2, 0, 1, 2, "right", "goose", "sky"), goose(3, 0, 1, 2, "right", "goose", "sky"),
      goose(2, 2, 2, 1, "down", "goose", "sky"), goose(2, 3, 2, 1, "down", "goose", "sky"),
      goose(0, 2, 1, 2, "left", "goose", "sky"), goose(1, 2, 1, 2, "left", "goose", "sky"),
    ],
    summary: "Eight flying geese in four pairs, each pair turned a quarter from the last, so the block seems to rotate.",
    assembly: "Sew the geese into four pairs, turn each pair a quarter from the last, sew them into two rows, then join the rows.",
  },
  {
    slug: "log-cabin",
    name: "Log Cabin",
    family: "Squares & strips",
    level: "Confident beginner",
    grid: 7,
    fabrics: [
      { id: "light", label: "Light logs" },
      { id: "dark", label: "Dark logs" },
      { id: "center", label: "Center" },
    ],
    units: [
      sq(3, 3, "center"),
      rect(3, 2, 1, 1, "light"), rect(4, 2, 1, 2, "light"), rect(3, 4, 2, 1, "dark"), rect(2, 2, 1, 3, "dark"),
      rect(2, 1, 3, 1, "light"), rect(5, 1, 1, 4, "light"), rect(2, 5, 4, 1, "dark"), rect(1, 1, 1, 5, "dark"),
      rect(1, 0, 5, 1, "light"), rect(6, 0, 1, 6, "light"), rect(1, 6, 6, 1, "dark"), rect(0, 0, 1, 7, "dark"),
    ],
    summary: "Strips spiral outward from a center square, with light fabrics on two sides and dark on the other two.",
    assembly: "Start at the center and add one strip at a time, clockwise: two light, two dark, pressing away from the center after each.",
  },
  {
    slug: "courthouse-steps",
    name: "Courthouse Steps",
    family: "Squares & strips",
    level: "Confident beginner",
    grid: 7,
    fabrics: [
      { id: "light", label: "Light steps" },
      { id: "dark", label: "Dark steps" },
      { id: "center", label: "Center" },
    ],
    units: [
      sq(3, 3, "center"),
      rect(3, 2, 1, 1, "light"), rect(3, 4, 1, 1, "light"), rect(2, 2, 1, 3, "dark"), rect(4, 2, 1, 3, "dark"),
      rect(2, 1, 3, 1, "light"), rect(2, 5, 3, 1, "light"), rect(1, 1, 1, 5, "dark"), rect(5, 1, 1, 5, "dark"),
      rect(1, 0, 5, 1, "light"), rect(1, 6, 5, 1, "light"), rect(0, 0, 1, 7, "dark"), rect(6, 0, 1, 7, "dark"),
    ],
    summary: "Strips are added to opposite sides of a center square, with light above and below and dark left and right.",
    assembly: "Start at the center and work outward: add light strips to the top and bottom, then dark strips to the sides, and repeat.",
  },
  {
    slug: "bears-paw",
    name: "Bear's Paw",
    family: "Triangles",
    level: "Intermediate",
    grid: 7,
    fabrics: [
      { id: "ground", label: "Background" },
      { id: "paw", label: "Paws" },
      { id: "center", label: "Center" },
    ],
    units: [
      ...fourWay(
        [
          sq(0, 0, "ground"),
          hst(1, 0, "sw", "paw", "ground"), hst(2, 0, "sw", "paw", "ground"),
          hst(0, 1, "ne", "paw", "ground"), hst(0, 2, "ne", "paw", "ground"),
          sq(1, 1, "paw", 2),
        ],
        7,
      ),
      rect(3, 0, 1, 3, "ground"), rect(3, 4, 1, 3, "ground"),
      rect(0, 3, 3, 1, "ground"), rect(4, 3, 3, 1, "ground"),
      sq(3, 3, "center"),
    ],
    summary: "Four paws, each a large square edged with small triangle claws, separated by a cross of strips.",
    assembly: "Build each paw: sew two claws to one side of the large square, then add two claws and a corner square to the next side. Join the paws and strips in three rows.",
  },
];

export const BLOCK_SLUGS = BLOCKS.map((b) => b.slug);

export function getBlock(slug: string): Block | undefined {
  return BLOCKS.find((b) => b.slug === slug);
}

export const FAMILIES: Family[] = ["Squares & strips", "Triangles", "Stars"];
