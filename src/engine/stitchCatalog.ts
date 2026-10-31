/**
 * Stitch patterns. Knit patterns are charts, and their written rows are derived
 * from the chart so the two can't disagree. Crochet rows are written out with
 * what each part consumes and makes, so tests can count them at every width.
 *
 * Only basic, long-established stitches belong here. Crochet terms are US.
 */

/** A knit chart row as seen from the right side, left to right: k or p. Row 1 first. */
export type KnitStitch = {
  craft: "knit";
  slug: string;
  name: string;
  level: string;
  summary: string;
  rowFactor: number;
  rows: string[];
  /** Stitches beyond whole repeats, continuing the chart, so edges balance. */
  extra: number;
};

export type CrochetMark = "sc" | "hdc" | "dc" | "ch";

/** One part of a row: how many stitches below it uses, and what it makes. */
export type CrochetPart = { consume: number; makes: CrochetMark[] };

export type CrochetRow = {
  text: string;
  start: CrochetPart;
  repeat: CrochetPart;
  /** How many fewer than the pattern's repeat count this row's repeat runs. */
  fewer: number;
  end?: CrochetPart;
};

export type CrochetStitch = {
  craft: "crochet";
  slug: string;
  name: string;
  level: string;
  summary: string;
  rowFactor: number;
  /** Chains to start with, for `n` repeats. */
  chains: (n: number) => number;
  first: CrochetRow;
  rows: CrochetRow[];
};

export type Stitch = KnitStitch | CrochetStitch;

const part = (consume: number, ...makes: CrochetMark[]): CrochetPart => ({ consume, makes });

export const KNIT_STITCHES: KnitStitch[] = [
  {
    craft: "knit",
    slug: "garter-stitch",
    name: "Garter Stitch",
    level: "Beginner",
    summary: "Knit every row. It lies flat, looks the same on both sides, and makes soft horizontal ridges.",
    rowFactor: 1.4,
    rows: ["k", "p"],
    extra: 0,
  },
  {
    craft: "knit",
    slug: "stockinette-stitch",
    name: "Stockinette Stitch",
    level: "Beginner",
    summary: "Knit one row, purl the next. It's smooth on the front, bumpy on the back, and its edges tend to curl.",
    rowFactor: 1,
    rows: ["k", "k"],
    extra: 0,
  },
  {
    craft: "knit",
    slug: "seed-stitch",
    name: "Seed Stitch",
    level: "Beginner",
    summary: "Knits and purls alternate along each row and stack in opposition, giving a firm, pebbled fabric that lies flat.",
    rowFactor: 1.1,
    rows: ["kp", "pk"],
    extra: 1,
  },
  {
    craft: "knit",
    slug: "double-seed-stitch",
    name: "Double Seed Stitch",
    level: "Beginner",
    summary: "Like seed stitch, but each pattern row is worked twice before the knits and purls swap, for a larger texture.",
    rowFactor: 1.1,
    rows: ["kp", "kp", "pk", "pk"],
    extra: 1,
  },
  {
    craft: "knit",
    slug: "one-by-one-rib",
    name: "1x1 Rib",
    level: "Beginner",
    summary: "Single knit and purl columns make a stretchy fabric, often used for cuffs and hems.",
    rowFactor: 1,
    rows: ["kp", "kp"],
    extra: 1,
  },
  {
    craft: "knit",
    slug: "two-by-two-rib",
    name: "2x2 Rib",
    level: "Beginner",
    summary: "Pairs of knit and purl columns give bolder ribs and plenty of stretch.",
    rowFactor: 1,
    rows: ["kkpp", "kkpp"],
    extra: 2,
  },
  {
    craft: "knit",
    slug: "broken-rib",
    name: "Broken Rib",
    level: "Beginner",
    summary: "One row of knit one, purl one alternates with a plain purl row, for a subtle rib with small ridges.",
    rowFactor: 1,
    rows: ["kp", "k"],
    extra: 1,
  },
  {
    craft: "knit",
    slug: "basketweave",
    name: "Basketweave",
    level: "Confident beginner",
    summary: "Blocks of knits and purls swap every four rows, so the fabric looks woven. It lies flat.",
    rowFactor: 1.1,
    rows: ["kkkkpppp", "kkkkpppp", "kkkkpppp", "kkkkpppp", "ppppkkkk", "ppppkkkk", "ppppkkkk", "ppppkkkk"],
    extra: 4,
  },
  {
    craft: "knit",
    slug: "diagonal-rib",
    name: "Diagonal Rib",
    level: "Confident beginner",
    summary: "A 2x2 rib that shifts one stitch on every row, so the ribs travel across the fabric at an angle.",
    rowFactor: 1,
    rows: ["kkpp", "kppk", "ppkk", "pkkp"],
    extra: 0,
  },
];

export const CROCHET_STITCHES: CrochetStitch[] = [
  {
    craft: "crochet",
    slug: "single-crochet",
    name: "Single Crochet",
    level: "Beginner",
    summary: "The shortest basic stitch, making a firm, dense fabric that's good for dishcloths and bags.",
    rowFactor: 1,
    chains: (n) => n + 1,
    first: { text: "Sc in 2nd ch from hook and in each ch across. Turn.", start: part(2, "sc"), repeat: part(1, "sc"), fewer: 1 },
    rows: [{ text: "Ch 1 (does not count as a st), sc in each st across. Turn.", start: part(1, "sc"), repeat: part(1, "sc"), fewer: 1 }],
  },
  {
    craft: "crochet",
    slug: "half-double-crochet",
    name: "Half Double Crochet",
    level: "Beginner",
    summary: "Between single and double crochet in height: quick to work, with a soft, warm feel.",
    rowFactor: 0.7,
    chains: (n) => n + 2,
    first: { text: "Hdc in 3rd ch from hook and in each ch across. Turn.", start: part(3, "hdc"), repeat: part(1, "hdc"), fewer: 1 },
    rows: [{ text: "Ch 2 (does not count as a st), hdc in each st across. Turn.", start: part(1, "hdc"), repeat: part(1, "hdc"), fewer: 1 }],
  },
  {
    craft: "crochet",
    slug: "double-crochet",
    name: "Double Crochet",
    level: "Beginner",
    summary: "A tall stitch that grows fast and drapes well, so it suits blankets and scarves.",
    rowFactor: 0.55,
    chains: (n) => n + 2,
    first: { text: "Dc in 4th ch from hook (first 3 ch count as a dc) and in each ch across. Turn.", start: part(3, "dc"), repeat: part(1, "dc"), fewer: 1 },
    rows: [{ text: "Ch 3 (counts as a dc), skip first st, dc in each st across, ending with a dc in the top of the turning ch. Turn.", start: part(1, "dc"), repeat: part(1, "dc"), fewer: 1 }],
  },
  {
    craft: "crochet",
    slug: "back-loop-rib",
    name: "Back Loop Rib",
    level: "Beginner",
    summary: "Single crochet worked through the back loop only, which forms stretchy ridges that resemble knit ribbing.",
    rowFactor: 0.9,
    chains: (n) => n + 1,
    first: { text: "Sc in 2nd ch from hook and in each ch across. Turn.", start: part(2, "sc"), repeat: part(1, "sc"), fewer: 1 },
    rows: [{ text: "Ch 1 (does not count as a st), sc in the back loop only of each st across. Turn.", start: part(1, "sc"), repeat: part(1, "sc"), fewer: 1 }],
  },
  {
    craft: "crochet",
    slug: "moss-stitch",
    name: "Moss Stitch",
    level: "Beginner",
    summary: "Single crochets separated by a chain, set into the spaces of the row below. Also called linen or granite stitch.",
    rowFactor: 1,
    chains: (n) => 2 * n + 4,
    first: {
      text: "Sc in 4th ch from hook, *ch 1, skip next ch, sc in next ch; repeat from * to end. Turn.",
      start: part(4, "ch", "sc"),
      repeat: part(2, "ch", "sc"),
      fewer: 0,
    },
    rows: [
      {
        text: "Ch 2 (counts as a ch-1 space), sc in first ch-1 space, *ch 1, skip next sc, sc in next ch-1 space; repeat from * to end, with the last sc in the turning ch space. Turn.",
        start: part(2, "ch", "sc"),
        repeat: part(2, "ch", "sc"),
        fewer: 0,
      },
    ],
  },
  {
    craft: "crochet",
    slug: "mesh-stitch",
    name: "Mesh Stitch",
    level: "Beginner",
    summary: "Double crochets separated by single chains, forming an open grid that's light and airy.",
    rowFactor: 0.55,
    chains: (n) => 2 * n + 4,
    first: {
      text: "Dc in 6th ch from hook (first 5 ch count as a dc and a ch-1 space), *ch 1, skip next ch, dc in next ch; repeat from * to end. Turn.",
      start: part(6, "dc", "ch", "dc"),
      repeat: part(2, "ch", "dc"),
      fewer: 1,
    },
    rows: [
      {
        text: "Ch 4 (counts as a dc and a ch-1 space), skip first ch-1 space, dc in next dc, *ch 1, skip next ch-1 space, dc in next dc; repeat from * to end, with the last dc in the 3rd ch of the turning ch. Turn.",
        start: part(3, "dc", "ch", "dc"),
        repeat: part(2, "ch", "dc"),
        fewer: 1,
      },
    ],
  },
  {
    craft: "crochet",
    slug: "v-stitch",
    name: "V-Stitch",
    level: "Confident beginner",
    summary: "Pairs of double crochet share a stitch, and each row stacks into the V's below for an open, textured fabric.",
    rowFactor: 0.55,
    chains: (n) => 3 * n + 4,
    first: {
      text: "Skip first 3 ch (they count as a dc), *skip next ch, (dc, ch 1, dc) in next ch, skip next ch; repeat from * to last ch, dc in last ch. Turn.",
      start: part(3, "dc"),
      repeat: part(3, "dc", "ch", "dc"),
      fewer: 0,
      end: part(1, "dc"),
    },
    rows: [
      {
        text: "Ch 3 (counts as a dc), skip first st, *skip next dc, (dc, ch 1, dc) in next ch-1 space, skip next dc; repeat from * to last st, dc in the top of the turning ch. Turn.",
        start: part(1, "dc"),
        repeat: part(3, "dc", "ch", "dc"),
        fewer: 0,
        end: part(1, "dc"),
      },
    ],
  },
];

export const STITCHES: Stitch[] = [...KNIT_STITCHES, ...CROCHET_STITCHES];
