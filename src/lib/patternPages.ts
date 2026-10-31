export type PatternPage = {
  slug: string;
  title: string;
  summary: string;
  customize: string;
  output: string;
  /** A static example at `public/samples/<slug>.svg`, made by hand until there's a generator. */
  sampleAlt: string;
};

export const PATTERN_PAGES: PatternPage[] = [
  {
    slug: "celtic-knots",
    title: "Celtic knots",
    summary: "Build interlaced knotwork from a grid, with clear over-under ribbon paths.",
    customize: "Grid, breaks, ribbon width, and interlace.",
    output: "SVG for laser or Cricut, a tattoo stencil, or a coloring page.",
    sampleAlt: "A square Celtic plait of a single-colored ribbon weaving over and under itself.",
  },
  {
    slug: "girih",
    title: "Geometric star patterns and girih",
    summary: "Explore geometric star patterns and girih-inspired arrangements.",
    customize: "Symmetry, star type, and line weight.",
    output: "Tile, stencil, or wall-panel files.",
    sampleAlt: "Rows of eight-point stars in navy and gold, with rust crosses between them.",
  },
  {
    slug: "tessellations",
    title: "Tessellations",
    summary: "Create repeating motifs using any of the 17 wallpaper groups.",
    customize: "Motif, wallpaper group, and colors.",
    output: "A seamless repeat or a tile layout.",
    sampleAlt: "An angular navy and rust motif turned in quarter turns, repeating across the page.",
  },
  {
    slug: "tartans",
    title: "Tartans and plaids",
    summary: "Arrange colored threads into a balanced, repeating plaid.",
    customize: "Thread count and colors.",
    output: "A seamless swatch or a weaving guide.",
    sampleAlt: "A navy and green plaid with thin red and cream lines, woven in twill.",
  },
  {
    slug: "sashiko",
    title: "Sashiko",
    summary: "Lay out sashiko motifs for hand stitching.",
    customize: "Motif, spacing, and panel size.",
    output: "A stitch guide to print and transfer.",
    sampleAlt: "White running stitches on indigo, forming a repeating hemp leaf pattern.",
  },
  {
    slug: "cross-stitch",
    title: "Cross-stitch and needlepoint",
    summary: "Plan counted-thread designs with fabric and floss details.",
    customize: "Motif, fabric count, and floss colors.",
    output: "A chart, floss list, and finished size.",
    sampleAlt: "A charted red, gold and green flower made of X stitches on a grid.",
  },
  {
    slug: "stained-glass",
    title: "Stained glass",
    summary: "Arrange a design into numbered pieces with room for lead lines.",
    customize: "Layout, lead width, and glass colors.",
    output: "Numbered cutting patterns and a glass estimate.",
    sampleAlt: "A square rose panel of red, gold and blue glass, with dark lead lines and numbered pieces.",
  },
];

export function getPatternPage(slug: string): PatternPage | undefined {
  return PATTERN_PAGES.find((page) => page.slug === slug);
}
