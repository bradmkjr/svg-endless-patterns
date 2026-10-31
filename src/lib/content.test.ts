import { describe, expect, it } from "vitest";
import blog from "@/content/blog.json";
import { getBlock, getBlocks, getStitchPattern, getStitchPatterns } from "./generator";
import { getChangelog, getPosts, sampleHref, type PostSample } from "./content";
import { PREFIXED_LOCALES } from "./i18n";
import { parseState, serializeState } from "./state";
import { parseStitchState, serializeStitchState } from "./stitchState";
import { parseCrossStitchState, serializeCrossStitchState } from "./crossStitchState";
import { parseNeedlepointState, serializeNeedlepointState } from "./needlepointState";
import { parseTessellationState, serializeTessellationState } from "./tessellationState";
import { parseSashikoState, serializeSashikoState } from "./sashikoState";
import { parseCelticKnotState, serializeCelticKnotState } from "./celticKnotState";
import { parseStainedGlassState, serializeStainedGlassState } from "./stainedGlassState";
import { parseMandalaState, serializeMandalaState } from "./mandalaState";
import { parseGirihState, serializeGirihState } from "./girihState";
import { parseTieDyeState, serializeTieDyeState } from "./tieDyeState";
import { parseTruchetState, serializeTruchetState } from "./truchetState";
import { parseTartanState, serializeTartanState } from "./tartanState";

const sorted = (query: string) => [...new URLSearchParams(query).entries()].map(([k, v]) => `${k}=${v}`).sort();

async function knownPaths() {
  const posts = await getPosts();
  return new Set([
    "/", ...PREFIXED_LOCALES.map((l) => `/${l}/`), "/tartans/", "/truchet/", "/tie-dye/", "/girih/", "/mandalas/", "/stained-glass/", "/celtic-knots/", "/sashiko/", "/tessellations/", "/cross-stitch/", "/needlepoint/", "/blocks/", "/knitting/", "/crochet/", "/patterns/", "/palettes/", "/about/", "/acknowledgements/", "/blog/", "/changelog/",
    ...(await getBlocks()).map((b) => `/blocks/${b.slug}/`),
    ...(await getStitchPatterns("knit")).map((s) => `/knitting/${s.slug}/`),
    ...(await getStitchPatterns("crochet")).map((s) => `/crochet/${s.slug}/`),
    ...posts.map((p) => `/blog/${p.slug}/`),
  ]);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("blog posts", () => {
  it("have unique slugs and real dates", async () => {
    const posts = await getPosts();
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    for (const post of posts) {
      expect(post.date, post.slug).toMatch(DATE);
      expect(Number.isNaN(Date.parse(post.date)), post.slug).toBe(false);
      expect(post.summary.length, post.slug).toBeGreaterThan(0);
    }
  });

  it("each show sample patterns", async () => {
    for (const post of await getPosts()) {
      expect(post.body.some((block) => block.type === "samples" && block.items.length > 0), post.slug).toBe(true);
    }
  });

  it("link only to pages that exist", async () => {
    const known = await knownPaths();
    const text = JSON.stringify(blog);
    for (const [, path] of text.matchAll(/\]\((\/[^)?#]*)/g)) expect(known.has(path), path).toBe(true);
  });

  const samples = (blog as { slug: string; body: { type: string; items?: unknown[] }[] }[]).flatMap((post) =>
    post.body.flatMap((block) => (block.type === "samples" ? (block.items as PostSample[]).map((sample) => [post.slug, sample.slug, sample] as const) : [])),
  );

  it.each(samples)("%s: %s deep link keeps every setting", async (_, slug, sample) => {
    // A setting the tool rejects or ignores would drop out of this round trip.
    if (sample.kind === "crossStitch") {
      expect(sorted(serializeCrossStitchState(parseCrossStitchState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "needlepoint") {
      expect(sorted(serializeNeedlepointState(parseNeedlepointState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "tartan") {
      expect(sorted(serializeTartanState(parseTartanState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "tessellation") {
      expect(sorted(serializeTessellationState(parseTessellationState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "sashiko") {
      expect(sorted(serializeSashikoState(parseSashikoState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "celtic") {
      expect(sorted(serializeCelticKnotState(parseCelticKnotState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "stainedGlass") {
      expect(sorted(serializeStainedGlassState(parseStainedGlassState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "mandala") {
      expect(sorted(serializeMandalaState(parseMandalaState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "girih") {
      expect(sorted(serializeGirihState(parseGirihState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "tieDye") {
      expect(sorted(serializeTieDyeState(parseTieDyeState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "truchet") {
      expect(sorted(serializeTruchetState(parseTruchetState(new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else if (sample.kind === "block") {
      const info = (await getBlock(slug))!;
      expect(info, slug).toBeDefined();
      expect(sorted(serializeState(info, parseState(info, new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    } else {
      const info = (await getStitchPattern(sample.kind, slug))!;
      expect(info, slug).toBeDefined();
      expect(sorted(serializeStitchState(info, parseStitchState(info, new URLSearchParams(sample.query), sample.locale)))).toEqual(sorted(sample.query));
    }
    expect((await knownPaths()).has(sampleHref({ ...sample, locale: undefined }).split("?")[0])).toBe(true);
  });
});

describe("changelog", () => {
  it("is dated, has items, and links only to real posts", async () => {
    const slugs = (await getPosts()).map((p) => p.slug);
    for (const entry of await getChangelog()) {
      expect(entry.date, entry.title).toMatch(DATE);
      expect(entry.items.length, entry.title).toBeGreaterThan(0);
      if (entry.post) expect(slugs, entry.title).toContain(entry.post);
    }
  });

  it("mentions every blog post", async () => {
    const linked = (await getChangelog()).map((e) => e.post);
    for (const post of await getPosts()) expect(linked, post.slug).toContain(post.slug);
  });
});
