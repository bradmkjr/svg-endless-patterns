export type PatternPage = {
  slug: string;
  title: string;
  summary: string;
  customize: string;
  output: string;
};

export const PATTERN_PAGES: PatternPage[] = [
  {
    slug: "celtic-knots",
    title: "Celtic knots",
    summary: "Build interlaced knotwork from a grid, with clear over-under ribbon paths.",
    customize: "Grid, breaks, ribbon width, and interlace.",
    output: "SVG for laser or Cricut, a tattoo stencil, or a coloring page.",
  },
  {
    slug: "girih",
    title: "Geometric star patterns and girih",
    summary: "Explore geometric star patterns and girih-inspired arrangements.",
    customize: "Symmetry, star type, and line weight.",
    output: "Tile, stencil, or wall-panel files.",
  },
  {
    slug: "tessellations",
    title: "Tessellations",
    summary: "Create repeating motifs using any of the 17 wallpaper groups.",
    customize: "Motif, wallpaper group, and colors.",
    output: "A seamless repeat or a tile layout.",
  },
  {
    slug: "tartans",
    title: "Tartans and plaids",
    summary: "Arrange colored threads into a balanced, repeating plaid.",
    customize: "Thread count and colors.",
    output: "A seamless swatch or a weaving guide.",
  },
  {
    slug: "sashiko",
    title: "Sashiko",
    summary: "Lay out sashiko motifs for hand stitching.",
    customize: "Motif, spacing, and panel size.",
    output: "A stitch guide to print and transfer.",
  },
  {
    slug: "cross-stitch",
    title: "Cross-stitch and needlepoint",
    summary: "Plan counted-thread designs with fabric and floss details.",
    customize: "Motif, fabric count, and floss colors.",
    output: "A chart, floss list, and finished size.",
  },
  {
    slug: "stained-glass",
    title: "Stained glass",
    summary: "Arrange a design into numbered pieces with room for lead lines.",
    customize: "Layout, lead width, and glass colors.",
    output: "Numbered cutting patterns and a glass estimate.",
  },
];

export function getPatternPage(slug: string): PatternPage | undefined {
  return PATTERN_PAGES.find((page) => page.slug === slug);
}
