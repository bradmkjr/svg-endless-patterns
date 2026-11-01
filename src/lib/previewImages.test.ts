import { afterEach, describe, expect, it, vi } from "vitest";
import { imageList, internalPreviewUrl } from "./previewImages";
import { previewOpenGraph, previewSrc, thumbSrc, TOOL_OPTIONS } from "./toolOptions";

afterEach(() => vi.unstubAllEnvs());

describe("without prerendering", () => {
  it("uses the public API for thumbnails, and has no preview", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "");
    expect(thumbSrc("truchet", "arcs")).toContain("/api/v1.0.1/thumbnail/truchet/arcs");
    expect(previewSrc("truchet", "arcs")).toBeNull();
    expect(previewOpenGraph("truchet", "arcs", "T", "D")).toBeUndefined();
  });
});

describe("with prerendering", () => {
  it("serves API pictures as static PNGs", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "1");
    expect(thumbSrc("truchet", "arcs")).toBe("/previews/320/truchet/arcs.png");
    expect(thumbSrc("maze", "circle")).toBe("/previews/320/maze/circle.png");
    expect(previewSrc("fractal", "koch-snowflake")).toBe("/previews/1200/fractal/koch-snowflake.png");
    expect(previewOpenGraph("truchet", "arcs", "T", "D")?.images).toEqual([{ url: expect.stringContaining("/previews/1200/truchet/arcs.png"), width: 1200, height: 1200 }]);
  });

  it("leaves pictures the site draws itself alone", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "1");
    expect(thumbSrc("blocks", "log-cabin")).toContain("/thumbs/blocks/log-cabin.svg");
    expect(previewSrc("blocks", "log-cabin")).toBeNull();
  });
});

describe("the build's list", () => {
  it("has every option of every API tool, once", () => {
    const list = imageList();
    expect(new Set(list.map((i) => `${i.group}/${i.slug}`)).size).toBe(list.length);
    for (const tool of Object.keys(TOOL_OPTIONS) as (keyof typeof TOOL_OPTIONS)[]) for (const { slug } of TOOL_OPTIONS[tool].options) expect(list.some((i) => i.group === tool && i.slug === slug), `${tool}/${slug}`).toBe(true);
    expect(list.some((i) => i.group === "tartan")).toBe(true);
  });

  it("asks only the internal URL", () => {
    vi.stubEnv("API_INTERNAL_URL", "http://127.0.0.1:4000/");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://public.example");
    expect(internalPreviewUrl("truchet", "arcs.png", "320")).toBe("http://127.0.0.1:4000/api/v1.0.1/preview/truchet/arcs.png?size=320");
  });
});
