import { afterEach, describe, expect, it, vi } from "vitest";
import { imageList, internalPngUrl, internalPreviewUrl } from "./previewImages";
import { previewOpenGraph, primaryImageSrc, thumbSrc, TOOL_OPTIONS } from "./toolOptions";

afterEach(() => vi.unstubAllEnvs());

describe("without an internal API", () => {
  it("loads small pictures from the public API, and has no main image", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "");
    expect(thumbSrc("truchet", "arcs")).toContain("/api/v1.0.1/thumbnail/truchet/arcs");
    expect(primaryImageSrc("truchet", "arcs")).toBeNull();
    expect(previewOpenGraph("truchet", "arcs", "T", "D")).toBeUndefined();
  });
});

describe("with an internal API", () => {
  it("makes small pictures static SVGs and main images static PNGs", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "1");
    expect(thumbSrc("truchet", "arcs")).toBe("/previews/truchet/arcs.svg");
    expect(thumbSrc("maze", "circle")).toBe("/previews/maze/circle.svg");
    expect(primaryImageSrc("truchet", "arcs")).toBe("/previews/truchet/arcs.png");
    expect(previewOpenGraph("truchet", "arcs", "T", "D")?.images[0].url).toContain("/previews/truchet/arcs.png");
  });

  it("leaves pictures the site draws itself alone", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "1");
    expect(thumbSrc("blocks", "log-cabin")).toContain("/thumbs/blocks/log-cabin.svg");
    expect(primaryImageSrc("blocks", "log-cabin")).toBeNull();
  });
});

describe("the build's list", () => {
  it("cover every option of every API tool, once", () => {
    const list = imageList();
    expect(new Set(list.map((i) => `${i.group}/${i.slug}`)).size).toBe(list.length);
    for (const tool of Object.keys(TOOL_OPTIONS) as (keyof typeof TOOL_OPTIONS)[]) for (const { slug } of TOOL_OPTIONS[tool].options) expect(list.some((i) => i.group === tool && i.slug === slug), `${tool}/${slug}`).toBe(true);
    expect(list.some((i) => i.group === "tartan")).toBe(true);
  });

  it("are asked of the internal URL only", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://127.0.0.1:4000/");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://public.example");
    expect(internalPreviewUrl("truchet", "arcs.svg")).toBe("http://127.0.0.1:4000/api/v1.0.1/thumbnail/truchet/arcs");
    expect(internalPngUrl("truchet", "arcs.png")).toBe("http://127.0.0.1:4000/api/v1.0.1/preview/truchet/arcs.png?size=1200");
    expect(internalPreviewUrl("knitColorwork", "heart-block.svg")).toBe("http://127.0.0.1:4000/api/v1.0.1/knit-colorwork/thumbnail/heart-block");
  });
});
