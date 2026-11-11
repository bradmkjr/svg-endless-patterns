import type { PostSample } from "./content";

/**
 * Seasonal collections: existing tools set up in a season's colors and motifs, each
 * opening its builder with those settings. Their text is in `i18n/messages/seasonal.json`.
 */

export type SeasonId = "winter";
/** A sample without its caption, which comes from the season's text by `id`. */
export type SeasonSample = PostSample extends infer S ? (S extends PostSample ? Omit<S, "caption"> & { id: string } : never) : never;
export type SeasonGroup = { id: string; samples: SeasonSample[] };
export type Season = { id: SeasonId; groups: SeasonGroup[]; featured: string[] };

export const SEASONS: Season[] = [
  {
    id: "winter",
    featured: ["snowman", "selbuStar", "kochSnowflake", "lantern"],
    groups: [
      {
        id: "figures",
        samples: [
          { id: "snowman", kind: "crossStitch", slug: "", query: "m=snowman", view: "stitched" },
          { id: "mittens", kind: "crossStitch", slug: "", query: "m=mittens", view: "stitched" },
          { id: "letItSnow", kind: "maze", slug: "", query: "shape=hidden-message&d=easy&m=LET+IT+SNOW&ln=23395d&ac=9cc3dc", view: "solution" },
          { id: "snowball", kind: "block", slug: "snowball", query: "f_ball=f4f6f8&f_corners=6f9fc0", view: "quilt" },
          { id: "santaHat", kind: "origami", slug: "", query: "m=santa-hat&p=plain&f=b3262e&b=ffffff", view: "finished" },
        ],
      },
      {
        id: "snowflakes",
        samples: [
          { id: "crossSnowflake", kind: "crossStitch", slug: "", query: "m=snowflake&c=ffffff-9cc3dc-c9d6e3&f=1b2a49", view: "stitched" },
          { id: "kochSnowflake", kind: "fractal", slug: "", query: "t=koch-snowflake&bg=1b2a49&c1=e6f1f8&c2=9cc3dc", view: "art" },
          { id: "kaleidoscope", kind: "kaleidoscope", slug: "", query: "src=shards&c=ffffff,9cc3dc,4a7bd0,1b2a49&bg=eaf2f8", view: "art" },
          { id: "mandala", kind: "mandala", slug: "", query: "m=dots.diamonds.stars&r=6", view: "coloring" },
          { id: "iceRay", kind: "chineseLattice", slug: "", query: "bg=e6f1f8&ln=23395d&ac=9cc3dc", view: "panel" },
          { id: "asanoha", kind: "sashiko", slug: "", query: "c=f4f6f8&t=1b2a49", view: "panel" },
          { id: "frost", kind: "crochetColorwork", slug: "", query: "d=frost&cc=6f9fc0", view: "square" },
          { id: "frostFerns", kind: "nature", slug: "", query: "m=ferns&bg=2b4a6b&pr=e6f1f8&se=c9dbe8&ac=9cc3dc", view: "repeat" },
          { id: "icicles", kind: "crossStitch", slug: "", query: "m=icicles", view: "stitched" },
        ],
      },
      {
        id: "light",
        samples: [
          { id: "candle", kind: "crossStitch", slug: "", query: "m=candle", view: "stitched" },
          { id: "lantern", kind: "crossStitch", slug: "", query: "m=lantern", view: "stitched" },
          { id: "sunburst", kind: "stainedGlass", slug: "", query: "l=sunburst&c=f2c14e-e07a1f-fbe7a6-1b2a49", view: "panel" },
          { id: "candlelight", kind: "mandala", slug: "", query: "st=flowing&k=f2c14e-e07a1f-b3262e-fbe7a6&bg=1b2a49", view: "art" },
        ],
      },
      {
        id: "greenery",
        samples: [
          { id: "wreath", kind: "crossStitch", slug: "", query: "m=gardenWreath&c=1f5c3d-b3262e-e0a526-4c8a5a", view: "stitched" },
          { id: "pines", kind: "knitColorwork", slug: "", query: "cc=1f5c3d", view: "square" },
          { id: "celtic", kind: "celtic", slug: "", query: "p=frame&k=1f5c3d-b3262e&bg=f7f3e8", view: "art" },
          { id: "tartan", kind: "tartan", slug: "", query: "s=a8123a.24-1f5c3d.12-a8123a.4-e8b92f.2", view: "swatch" },
          { id: "origamiTree", kind: "origami", slug: "", query: "m=christmas-tree&p=plain&f=1f5c3d&a=e8b92f", view: "finished" },
        ],
      },
      {
        id: "stars",
        samples: [
          { id: "selbuStar", kind: "crossStitch", slug: "", query: "m=selbuStar", view: "stitched" },
          { id: "northStar", kind: "crossStitch", slug: "", query: "m=northStar", view: "stitched" },
          { id: "eightPointStar", kind: "crochetColorwork", slug: "", query: "d=eight-point-star&c=1b2a49&cc=f4f6f8-e8b92f-9cc3dc", view: "square" },
          { id: "lemoyneStar", kind: "block", slug: "lemoyne-star", query: "f_ground=f7f3e8&f_star=a8123a&f_alternate=1f5c3d", view: "block" },
          { id: "starSampler", kind: "quilt", slug: "star-sampler", query: "p=eef2f5-2b3a55-8a1c2b-5d7f73-b8c4d0-c9a86a&bc=1e2a3d", view: "quilt" },
        ],
      },
      {
        id: "woodland",
        samples: [
          { id: "cardinal", kind: "crossStitch", slug: "", query: "m=cardinal", view: "stitched" },
          { id: "bareTree", kind: "fractal", slug: "", query: "t=fractal-tree&bg=eef2f5&c1=3a2a20&c2=6b4226", view: "art" },
          { id: "buffaloCheck", kind: "checkerboard", slug: "", query: "p=gingham&c=12&r=12&k=a8123a-1a1a1a", view: "art" },
          { id: "summerWinter", kind: "weaving", slug: "", query: "s=summer-and-winter&wp=f4ecdc.1&wf=a8123a.1", view: "draft" },
          { id: "cable", kind: "knit", slug: "rope-cable", query: "color=efe6d2", view: "swatch" },
        ],
      },
    ],
  },
];

export function getSeason(id: string): Season | undefined {
  return SEASONS.find((season) => season.id === id);
}

export const seasonSamples = (season: Season) => season.groups.flatMap((group) => group.samples);
