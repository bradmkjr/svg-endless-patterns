import { describe, expect, it } from "vitest";
import blog from "@/content/blog.json";
import changelog from "@/content/changelog.json";
import { CONTENT_TRANSLATIONS, formatDate, getChangelog, getPost, getPosts, sampleHref } from "./content";
import { getBlock } from "./generator";
import { localePath, MESSAGES, pageAlternates, PREFIXED_LOCALES, stripLocale } from "./i18n";
import { defaultState, palettesFor, parseState, serializeState } from "./state";
import { defaultStitchState } from "./stitchState";

/** Every text leaf, as path and value, so translations can be compared with English. */
function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const links = (text: string) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
// English leaves these empty: they only say something about a translation.
const TRANSLATION_ONLY = new Set([".footer.draft", ".palettes.flag", ".about.languageH", ".about.language"]);

describe.each(PREFIXED_LOCALES)("%s site text", (locale) => {
  const english = new Map(leaves(MESSAGES.en));
  const translated = new Map(leaves(MESSAGES[locale]));

  it("has the same keys as English, none empty, with the same placeholders", () => {
    expect([...translated.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of translated) {
      expect(text, key).not.toBe("");
      expect(placeholders(text), key).toEqual(placeholders(english.get(key)!));
    }
  });

  it("isn't still English, apart from words shared across languages", () => {
    const same = [...translated].filter(([key, text]) => text === english.get(key) && !TRANSLATION_ONLY.has(key)).map(([key]) => key);
    expect(same.length / translated.size).toBeLessThan(0.1);
  });

  const content = CONTENT_TRANSLATIONS[locale as keyof typeof CONTENT_TRANSLATIONS];

  it("translates every post, block for block, keeping its links", () => {
    for (const post of blog as { slug: string; body: { type: string; text?: string; items?: unknown[] }[] }[]) {
      const translation = content.posts[post.slug];
      expect(translation, post.slug).toBeDefined();
      expect(translation.blocks, post.slug).toHaveLength(post.body.length);
      post.body.forEach((block, i) => {
        const text = translation.blocks[i];
        if (block.items) expect(text, `${post.slug} ${i}`).toHaveLength(block.items.length);
        else {
          expect(typeof text, `${post.slug} ${i}`).toBe("string");
          expect(links(text as string), `${post.slug} ${i}`).toEqual(links(block.text!));
        }
      });
    }
  });

  it("translates every changelog entry", () => {
    for (const entry of changelog as { title: string; items: string[] }[]) {
      expect(content.changelog[entry.title]?.items, entry.title).toHaveLength(entry.items.length);
    }
  });

  it("gives posts, the changelog and dates in the language", async () => {
    const posts = await getPosts(locale);
    const post = (await getPost(posts[0].slug, locale))!;
    expect(post.title).not.toBe((await getPost(posts[0].slug))!.title);
    expect((await getChangelog(locale))[0].title).not.toBe((await getChangelog())[0].title);
    expect(formatDate("2026-10-30", locale)).not.toBe(formatDate("2026-10-30"));
  });

  it("defaults to its own palette, and share links keep working", async () => {
    const block = (await getBlock("ohio-star", locale))!;
    const state = defaultState(block, locale);
    expect(palettesFor(locale)[0].id).toBe("flag");
    expect(state.locale).toBe(locale);
    expect(state.colors).not.toEqual(defaultState(block).colors);
    expect(serializeState(block, state)).toBe("");
    const changed = { ...state, size: 9 };
    expect(parseState(block, new URLSearchParams(serializeState(block, changed)), locale)).toEqual(changed);
    expect(defaultStitchState({ slug: "x", name: "x", craft: "knit", level: "", summary: "", rowFactor: 1 }, locale).color).not.toBe("#23395d");
  });

  it("builds paths under its prefix", () => {
    expect(localePath(locale, "/blocks/")).toBe(`/${locale}/blocks/`);
    expect(stripLocale(`/${locale}/blocks/`)).toBe("/blocks/");
    expect(stripLocale(`/${locale}/`)).toBe("/");
    expect(sampleHref({ kind: "knit", slug: "seed-stitch", query: "", view: "swatch", caption: "" }, locale)).toBe(`/${locale}/knitting/seed-stitch/`);
  });
});

describe("paths", () => {
  it("leaves English at the original URLs", () => {
    expect(localePath("en", "/blocks/")).toBe("/blocks/");
  });

  it("keeps a path that already names a language, so posts can link across them", () => {
    expect(localePath("fr", "/es/")).toBe("/es/");
  });

  it("gives search engines every language of a page", () => {
    const { canonical, languages } = pageAlternates("de", "/about/");
    expect(canonical).toContain("/de/about/");
    expect(Object.keys(languages).sort()).toEqual(["de", "en", "es", "fr", "pt-BR", "x-default"]);
    expect(languages["x-default"]).not.toContain("/de/");
  });

  it("lets a sample name its own language", () => {
    expect(sampleHref({ kind: "block", slug: "pinwheel", query: "", view: "block", caption: "", locale: "de" })).toBe("/de/blocks/pinwheel/");
  });
});
