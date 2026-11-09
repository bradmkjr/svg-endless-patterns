import { hsl } from "./palettes";

/** Eighteen plain colors anyone can name, offered beside every color square. */
export const BASIC_COLORS = [
  { id: "red", hex: "#c62828" },
  { id: "orange", hex: "#ef6c00" },
  { id: "yellow", hex: "#fbc02d" },
  { id: "lightGreen", hex: "#8bc34a" },
  { id: "green", hex: "#2e7d32" },
  { id: "teal", hex: "#00897b" },
  { id: "lightBlue", hex: "#4fa3e0" },
  { id: "blue", hex: "#1e4fa3" },
  { id: "navy", hex: "#1a2a4f" },
  { id: "purple", hex: "#6a3d9a" },
  { id: "lavender", hex: "#b39ddb" },
  { id: "pink", hex: "#e57399" },
  { id: "maroon", hex: "#7b1e2b" },
  { id: "brown", hex: "#795033" },
  { id: "white", hex: "#ffffff" },
  { id: "cream", hex: "#f4ecdc" },
  { id: "gray", hex: "#8a8a8a" },
  { id: "black", hex: "#1b1b1b" },
] as const;

export type BasicColorId = (typeof BASIC_COLORS)[number]["id"];

/** A color as `#rrggbb` in lower case, or null if it isn't one. */
export function normalizeHex(value: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const digits = match[1]!.length === 3 ? [...match[1]!].map((d) => d + d).join("") : match[1]!;
  return `#${digits.toLowerCase()}`;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hue in degrees, saturation and lightness in percent. */
export function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

/** How far apart two colors look, roughly: 0 is identical, about 765 is black against white. */
function distance(a: string, b: string): number {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return Math.abs(ar - br) * 0.3 + Math.abs(ag - bg) * 0.59 + Math.abs(ab - bb) * 0.11;
}

/** The same color a step lighter (positive) or darker (negative), in lightness percent. */
export function shade(hex: string, step: number): string {
  const [h, s, l] = toHsl(hex);
  return hsl(h, s, Math.max(0, Math.min(100, l + step)));
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** Turns around the color wheel that go well with a color: its complement first, then split complements, neighbors and triads. */
const TURNS = [180, 150, 210, 30, -30, 120, 240];

/**
 * `count` colors that go with the colors already on a pattern: the complements,
 * neighbors and triads of each colored one, taking turns between them, then lighter
 * and darker versions. Grays and near-whites have no hue to match, so a pattern of
 * only those gets a soft set around the wheel. Sorted by hue, so they read as a row of fabric.
 */
export function matchingColors(active: string[], count = 12): string[] {
  const colors = [...new Set(active.map(normalizeHex).filter((c): c is string => c !== null))];
  const hued = colors
    .map((hex) => ({ hex, hsl: toHsl(hex) }))
    .filter(({ hsl: [, s, l] }) => s >= 18 && l > 8 && l < 94)
    .sort((a, b) => b.hsl[1] - a.hsl[1])
    .slice(0, 4);

  const picked: string[] = [];
  const add = (hex: string) => {
    if (picked.length < count && ![...picked, ...colors].some((c) => distance(c, hex) < 22)) picked.push(hex);
  };

  if (hued.length > 0) {
    const variants = [
      ...TURNS.map((turn) => (h: number, s: number, l: number) => hsl(h + turn, clamp(s, 35, 80), clamp(l, 30, 68))),
      (h: number, s: number, l: number) => hsl(h + 180, clamp(s, 30, 70), clamp(l + 25, 70, 88)),
      (h: number, s: number, l: number) => hsl(h + 180, clamp(s, 35, 75), clamp(l - 25, 15, 32)),
      (h: number, s: number, l: number) => hsl(h, clamp(s, 25, 70), clamp(l + 30, 75, 92)),
      (h: number, s: number, l: number) => hsl(h, clamp(s, 30, 75), clamp(l - 30, 12, 28)),
    ];
    for (const variant of variants) for (const { hsl: [h, s, l] } of hued) add(variant(h, s, l));
  }
  // Grays only, or colors so alike they ran out: soft colors evenly around the wheel.
  const start = hued[0]?.hsl[0] ?? 15;
  for (let i = 0; picked.length < count && i < 72; i++) add(hsl(start + (i % 12) * 30 + Math.floor(i / 12) * 15, 50, [42, 62, 30, 75, 52, 22][Math.floor(i / 12)]!));

  return picked.sort((a, b) => toHsl(a)[0] - toHsl(b)[0] || toHsl(a)[2] - toHsl(b)[2]);
}

/**
 * The complementary row: the colors already on the pattern first, in the order
 * they appear, then suggestions to fill `count`, never fewer than `minSuggested`.
 */
export function complementaryRow(active: string[], count = 12, minSuggested = 6): { used: string[]; suggested: string[] } {
  const used = [...new Set(active.map(normalizeHex).filter((c): c is string => c !== null))];
  return { used, suggested: matchingColors(used, Math.max(minSuggested, count - used.length)) };
}
