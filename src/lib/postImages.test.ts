import { describe, expect, it } from "vitest";
import { getPosts } from "./content";
import { imageList } from "./previewImages";
import { postImage } from "./postImages";
import { thumbSrc } from "./toolOptions";

describe("featured images", () => {
  it("gives every post the thumbnail of a pattern that exists", async () => {
    const known = new Set(imageList().map(({ group, slug }) => thumbSrc(group, slug)));
    for (const post of await getPosts()) expect(known.has(postImage(post)), `${post.slug}: ${postImage(post)}`).toBe(true);
  }, 120000);

  it("follows the choice in the first sample's link", () => {
    const sample = (kind: string, query: string, slug = "") => ({ body: [{ type: "samples", items: [{ kind, slug, query, view: "art", caption: "" }] }] }) as never;
    expect(postImage(sample("truchet", "style=triangles"))).toContain("/thumbnail/truchet/triangles");
    expect(postImage(sample("celtic", "p=diamond"))).toContain("/thumbnail/celticKnot/diamond");
    expect(postImage(sample("mandala", "n=8"))).toContain("/thumbnail/mandala/8-fold");
    expect(postImage(sample("block", "", "ohio-star"))).toContain("/thumbnail/blocks/ohio-star");
  });

  it("has a fallback for a post with no samples", () => {
    expect(postImage({ body: [] })).toContain("/thumbnail/blocks/log-cabin");
  });
});
