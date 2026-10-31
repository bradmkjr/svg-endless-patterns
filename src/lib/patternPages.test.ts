import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { PATTERN_PAGES } from "./patternPages";

describe("planned pattern pages", () => {
  it("have unique slugs", () => {
    expect(new Set(PATTERN_PAGES.map((p) => p.slug)).size).toBe(PATTERN_PAGES.length);
  });

  it("stay out of the sitemap until there's a tool to use", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/patterns/"))).toBe(true);
    for (const { slug } of PATTERN_PAGES) expect(urls.some((url) => url.includes(`/patterns/${slug}`))).toBe(false);
  });
});

describe("planned pattern samples", () => {
  it.each(PATTERN_PAGES.map((p) => [p.slug, p] as const))("%s has a static sample and a description", (slug, page) => {
    expect(existsSync(join(process.cwd(), "public/samples", `${slug}.svg`))).toBe(true);
    expect(page.sampleAlt.length).toBeGreaterThan(0);
  });
});
