import { describe, expect, it } from "vitest";
import { getPosts } from "./content";
import { allThumbs } from "./thumbnails";
import { postImage } from "./postImages";
import { thumbSrc, TOOL_OPTIONS, type ThumbGroup, type ToolId } from "./toolOptions";

describe("featured images", () => {
  it("gives every post the thumbnail of a pattern that exists", async () => {
    const known = new Set((await allThumbs()).map((thumb) => thumbSrc(thumb.group as ThumbGroup, thumb.slug)));
    for (const tool of Object.keys(TOOL_OPTIONS) as ToolId[]) for (const { slug } of TOOL_OPTIONS[tool].options) known.add(thumbSrc(tool, slug));
    for (const post of await getPosts()) expect(known.has(postImage(post)), `${post.slug}: ${postImage(post)}`).toBe(true);
  }, 120000);

  it("follows the choice in the first sample's link", () => {
    const sample = (kind: string, query: string, slug = "") => ({ body: [{ type: "samples", items: [{ kind, slug, query, view: "art", caption: "" }] }] }) as never;
    expect(postImage(sample("truchet", "style=triangles"))).toContain("/thumbs/truchet/triangles.svg");
    expect(postImage(sample("celtic", "p=diamond"))).toContain("/thumbs/celticKnot/diamond.svg");
    expect(postImage(sample("mandala", "n=8"))).toContain("/thumbs/mandala/8-fold.svg");
    expect(postImage(sample("block", "", "ohio-star"))).toContain("/thumbs/blocks/ohio-star.svg");
  });

  it("has a fallback for a post with no samples", () => {
    expect(postImage({ body: [] })).toContain("/thumbs/blocks/log-cabin.svg");
  });
});
