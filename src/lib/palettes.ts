import text from "@/i18n/messages/palettes.json";

/**
 * The site's palette library. A palette's first color is a light ground, its second a
 * dark or main color, and the rest are accents, so any tool can place them the same way.
 */

export type GroupId = keyof typeof text.en.groups;
export type NamedId = keyof typeof text.en.names;
export type HarmonyId = keyof typeof text.en.harmonyNames;
export type HueId = keyof typeof text.en.hues;

export const THEME_GROUPS: { id: GroupId; palettes: { id: NamedId; colors: string[] }[] }[] = [
  {
    id: "earth",
    palettes: [
      { id: "terracotta", colors: ["#f5e9da", "#3a2418", "#b5533c", "#d98e4a", "#7d8c6a"] },
      { id: "adobe", colors: ["#f3e4cf", "#4a2c1d", "#a65e3a", "#c98b5e", "#5f7470"] },
      { id: "ochre", colors: ["#f6ecd4", "#33291a", "#c28e24", "#8a5a2b", "#a4492f"] },
      { id: "walnut", colors: ["#efe5d6", "#2c1e15", "#6b4226", "#a47148", "#c9a66b"] },
      { id: "rust", colors: ["#f4e8dc", "#2f2a26", "#a8451f", "#d2772f", "#6e7f80"] },
      { id: "sandstone", colors: ["#f7efe2", "#54433a", "#c9a27e", "#a9674c", "#7f9183"] },
    ],
  },
  {
    id: "ocean",
    palettes: [
      { id: "tide", colors: ["#eef6f5", "#0f3346", "#14607a", "#3aa0a8", "#f0b26a"] },
      { id: "lagoon", colors: ["#effaf7", "#0e4a52", "#1b998b", "#7bdcb5", "#f4d35e"] },
      { id: "harbor", colors: ["#f1f0ea", "#1c2c42", "#3f6184", "#8aa6bf", "#c8553d"] },
      { id: "deepsea", colors: ["#e6eff2", "#0a1d2e", "#123c52", "#2a7f9e", "#45b5aa"] },
      { id: "seaglass", colors: ["#f2f7f3", "#2e4a4f", "#8cc5b2", "#b6dcd0", "#d6a77a"] },
      { id: "coral", colors: ["#fdf3ec", "#143642", "#ec6e4c", "#f7a78b", "#2a9d8f"] },
    ],
  },
  {
    id: "forest",
    palettes: [
      { id: "pine", colors: ["#eef0e4", "#14301f", "#1f5c3d", "#6f8467", "#b8862b"] },
      { id: "moss", colors: ["#f1f1dd", "#2d3417", "#6a7a2c", "#a3ad5a", "#8a5a2b"] },
      { id: "fern", colors: ["#f0f6e8", "#1c3a29", "#3f8f5b", "#9dbf6b", "#d9902f"] },
      { id: "autumn", colors: ["#f7ecd9", "#33241a", "#b4552d", "#d9a441", "#5c6b3a"] },
      { id: "birch", colors: ["#f6f4ec", "#3a3a33", "#a9a68f", "#6f8467", "#c9a66b"] },
      { id: "sage", colors: ["#eee9da", "#34402f", "#6f8467", "#b4552d", "#d6b77a"] },
    ],
  },
  {
    id: "florals",
    palettes: [
      { id: "rose", colors: ["#fdf1f0", "#4a1f2d", "#c8476b", "#f09ca8", "#6f8467"] },
      { id: "lavender", colors: ["#f6f2fa", "#352a57", "#7d6bb0", "#b9a8dc", "#a4b56e"] },
      { id: "poppy", colors: ["#fbf3e6", "#26221d", "#d6342b", "#f2a33a", "#4c7a4a"] },
      { id: "peony", colors: ["#fdf2f4", "#51223b", "#d9607f", "#f7b7c3", "#7fa35c"] },
      { id: "wisteria", colors: ["#f5f2f8", "#2f2c4f", "#8a7fc4", "#c7bfe8", "#7ea27a"] },
      { id: "marigold", colors: ["#fdf6e0", "#3a2410", "#ee9b1c", "#d9591f", "#587d3b"] },
    ],
  },
  {
    id: "jewel",
    palettes: [
      { id: "sapphire", colors: ["#eef1f8", "#0f1a3f", "#1d3f9c", "#4a7bd0", "#e0b13a"] },
      { id: "emerald", colors: ["#edf6f0", "#08301f", "#0f7a4d", "#49b582", "#d9b13b"] },
      { id: "ruby", colors: ["#faeff0", "#3a0a17", "#a8123a", "#dd4a6c", "#e8b92f"] },
      { id: "amethyst", colors: ["#f4eff9", "#27103f", "#6a2c9c", "#a56dd1", "#2c8c99"] },
      { id: "topaz", colors: ["#fdf5e4", "#3a2406", "#d98a0b", "#f2c14e", "#14607a"] },
      { id: "peacock", colors: ["#ecf5f5", "#0b2b33", "#0e6e7c", "#2c8c99", "#c8326b"] },
    ],
  },
  {
    id: "vintage",
    palettes: [
      { id: "feedsack", colors: ["#f8f2e2", "#3a3a4a", "#d97b6c", "#7fa8a3", "#e3c15e"] },
      { id: "barn", colors: ["#f7f1e3", "#2f3e46", "#9c2b23", "#d9a441", "#5f7470"] },
      { id: "indigo", colors: ["#f4ecdc", "#1b2a49", "#23395d", "#7f9ab8", "#b5533c"] },
      { id: "retro", colors: ["#f7efdc", "#2e3a3f", "#e08a2e", "#3f9a8e", "#c94f3d"] },
      { id: "sampler", colors: ["#f5eedd", "#2c3a2e", "#8c3a33", "#4c6b56", "#c8a24a"] },
      { id: "bakelite", colors: ["#f6ead2", "#3c2415", "#c1561d", "#e2a63b", "#2f6f6a"] },
    ],
  },
  {
    id: "pastel",
    palettes: [
      { id: "nursery", colors: ["#fdfaf3", "#5b6573", "#f6c6c9", "#bcdcea", "#f6e3a1"] },
      { id: "macaron", colors: ["#fdf6f0", "#6a5560", "#f2b5c4", "#c5e3c8", "#d6c4ec"] },
      { id: "spring", colors: ["#fafaf0", "#55644f", "#cbe3a7", "#f7d6e0", "#a9d8e6"] },
      { id: "sherbet", colors: ["#fff8ee", "#6b5148", "#ffc9a3", "#ffe29a", "#a6e3cf"] },
      { id: "mist", colors: ["#f6f8fa", "#57677a", "#c6d4e3", "#d9d3e8", "#cfe4dc"] },
      { id: "shell", colors: ["#fdf8f3", "#6d5d57", "#f1d6c8", "#d8c6b8", "#b9cfd1"] },
    ],
  },
  {
    id: "neutral",
    palettes: [
      { id: "ink", colors: ["#fafafa", "#111111", "#4a4a4a", "#9a9a9a", "#d9d9d9"] },
      { id: "linen", colors: ["#f6f1e7", "#3e3a33", "#a89f8c", "#d3cab8", "#7c7364"] },
      { id: "slate", colors: ["#f1f3f4", "#20282e", "#55636e", "#8f9ca6", "#c8553d"] },
      { id: "charcoal", colors: ["#efe6d0", "#1e1e1e", "#3a3a3a", "#7a7468", "#b8862b"] },
      { id: "oat", colors: ["#f8f4ea", "#4e463a", "#cdbfa5", "#e4dac6", "#8c9a84"] },
      { id: "concrete", colors: ["#f2f2ef", "#2b2b2b", "#8a8a85", "#bdbdb7", "#e4572e"] },
    ],
  },
];

export const HUES: { id: HueId; degrees: number }[] = [{ id: "red", degrees: 0 }, { id: "orange", degrees: 30 }, { id: "gold", degrees: 50 }, { id: "lime", degrees: 85 }, { id: "green", degrees: 130 }, { id: "jade", degrees: 160 }, { id: "teal", degrees: 185 }, { id: "sky", degrees: 205 }, { id: "blue", degrees: 225 }, { id: "indigo", degrees: 250 }, { id: "violet", degrees: 280 }, { id: "magenta", degrees: 325 }];

/** Each harmony as turns around the color wheel, in degrees from the base hue. */
const HARMONY_TURNS: Record<HarmonyId, number[]> = {
  complementary: [0, 180],
  analogous: [0, -30, 30],
  triadic: [0, 120, 240],
  splitComplementary: [0, 150, 210],
  tetradic: [0, 90, 180],
  monochromatic: [0],
};
export const HARMONIES = Object.keys(HARMONY_TURNS) as HarmonyId[];

function hsl(degrees: number, saturation: number, lightness: number): string {
  const h = ((degrees % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Five colors: a tinted ground, a deep shade of the base hue, then the harmony's hues, with lighter tints to fill any gap. */
export function harmonyColors(harmony: HarmonyId, degrees: number): string[] {
  const hues = HARMONY_TURNS[harmony].map((turn) => hsl(degrees + turn, 62, 45));
  const tints = HARMONY_TURNS[harmony].map((turn) => hsl(degrees + turn, 55, 70));
  const middle = harmony === "monochromatic" ? [hues[0], hsl(degrees, 55, 60), tints[0]] : [...hues, ...tints].slice(0, 3);
  return [hsl(degrees, 35, 94), hsl(degrees, 40, 18), ...middle];
}

/** `count` colors for a tool's motifs: everything after the ground, repeating if there are too few. */
export function paletteAccents(colors: string[], count: number): string[] {
  const usable = colors.length > 1 ? colors.slice(1) : colors;
  return Array.from({ length: count }, (_, i) => usable[i % usable.length]);
}
