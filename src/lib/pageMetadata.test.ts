import { describe, expect, it } from "vitest";
import { cardUrl, pageMetadata, pathPicture } from "./pageMetadata";
import { OPENING_OPTION, optionPath, TOOL_OPTIONS, type ToolId } from "./toolOptions";

describe("share cards", () => {
  it("are the pattern of every tool and option page", () => {
    for (const tool of Object.keys(TOOL_OPTIONS) as ToolId[]) {
      expect(pathPicture(TOOL_OPTIONS[tool].path)).toEqual({ group: tool, slug: OPENING_OPTION[tool] });
      for (const { slug } of TOOL_OPTIONS[tool].options) expect(pathPicture(optionPath(tool, slug))).toEqual({ group: tool, slug });
    }
  });

  it("are API URLs, with the default for anything the API can't draw", () => {
    expect(cardUrl({ group: "maze", slug: "circle" })).toMatch(/\/api\/v[\d.]+\/card\/maze\/circle\.png$/);
    expect(cardUrl({ group: "blocks", slug: "log-cabin" })).toMatch(/\/api\/v[\d.]+\/card\/default\.png$/);
    expect(cardUrl()).toMatch(/\/card\/default\.png$/);
  });

  it("are named in every tag that shares a page", () => {
    const meta = pageMetadata("es", "/mazes/circle/", "T", "D");
    const url = cardUrl({ group: "maze", slug: "circle" });
    expect(meta.openGraph).toMatchObject({ type: "website", siteName: "Endless Patterns", locale: "es_ES", title: "T", description: "D", images: [{ url, width: 1200, height: 630 }] });
    expect(meta.openGraph?.url).toMatch(/\/es\/mazes\/circle\/$/);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [{ url }] });
  });
});
