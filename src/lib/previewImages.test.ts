import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { imageList, internalPreviewUrl } from "./previewImages";
import { primaryImageSrc, thumbSrc, TOOL_OPTIONS } from "./toolOptions";

afterEach(() => vi.unstubAllEnvs());

describe.each(["", "1"])("the main image (internal API flag=%s)", (flag) => {
  it("is a PNG on the public API, loaded when requested", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", flag);
    expect(primaryImageSrc("truchet", "arcs")).toMatch(/\/api\/v1\.0\.1\/preview\/truchet\/arcs\.png\?size=1200$/);
    expect(primaryImageSrc("blocks", "log-cabin")).toMatch(/\/preview\/blocks\/log-cabin\.png\?size=1200$/);
  });
});

describe("small pictures", () => {
  it("are static SVGs in a build with an internal API", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "1");
    expect(thumbSrc("truchet", "arcs")).toBe("/previews/truchet/arcs.svg");
    expect(thumbSrc("maze", "circle")).toBe("/previews/maze/circle.svg");
    expect(thumbSrc("blocks", "log-cabin")).toBe("/previews/blocks/log-cabin.svg");
  });

  it("are SVGs from the public API without one", () => {
    vi.stubEnv("NEXT_PUBLIC_PRERENDERED_IMAGES", "");
    expect(thumbSrc("truchet", "arcs")).toContain("/api/v1.0.1/thumbnail/truchet/arcs");
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
    expect(internalPreviewUrl("knitColorwork", "heart-block.svg")).toBe("http://127.0.0.1:4000/api/v1.0.1/knit-colorwork/thumbnail/heart-block");
  });
});

describe("the build", () => {
  it("never asks the API for a PNG", () => {
    const route = readFileSync("src/app/previews/[group]/[slug]/route.ts", "utf8") + readFileSync("src/lib/previewImages.ts", "utf8");
    expect(route).not.toMatch(/\.png|\/preview\//);
  });
});
