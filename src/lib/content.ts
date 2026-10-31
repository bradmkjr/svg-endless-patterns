/**
 * The site's only door to blog posts and the changelog. They're JSON files
 * today; to move to a database, replace these function bodies with queries.
 * Everything is already async and JSON-shaped, so no caller has to change.
 */
import blog from "@/content/blog.json";
import changelog from "@/content/changelog.json";
import de from "@/content/i18n/de.json";
import es from "@/content/i18n/es.json";
import fr from "@/content/i18n/fr.json";
import pt from "@/content/i18n/pt.json";
import type { Locale } from "./generator";
import { localePath } from "./i18n";

/** A sample in a post: a live pattern, and the deep link that opens it with these settings. */
export type PostSample =
  | { kind: "block"; slug: string; query: string; view: "block" | "quilt" | "tile"; caption: string; locale?: Locale }
  | { kind: "knit" | "crochet"; slug: string; query: string; view: "swatch" | "chart"; caption: string; locale?: Locale }
  | { kind: "crossStitch"; slug: ""; query: string; view: "stitched" | "chart"; caption: string; locale?: Locale }
  | { kind: "tessellation"; slug: ""; query: string; view: "repeat" | "layout"; caption: string; locale?: Locale }
  | { kind: "sashiko"; slug: ""; query: string; view: "panel"; caption: string; locale?: Locale }
  | { kind: "celtic"; slug: ""; query: string; view: "art"; caption: string; locale?: Locale }
  | { kind: "stainedGlass"; slug: ""; query: string; view: "panel" | "numbered"; caption: string; locale?: Locale }
  | { kind: "mandala"; slug: ""; query: string; view: "art" | "coloring"; caption: string; locale?: Locale }
  | { kind: "girih"; slug: ""; query: string; view: "repeat"; caption: string; locale?: Locale }
  | { kind: "tartan"; slug: ""; query: string; view: "swatch"; caption: string; locale?: Locale };

export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "samples"; items: PostSample[] };

export type Post = { slug: string; title: string; date: string; summary: string; body: PostBlock[] };

export type ChangelogEntry = { date: string; title: string; items: string[]; post?: string };

/** One entry per body block, in order: its text, its list items, or its sample captions. */
type PostTranslation = { title: string; summary: string; blocks: (string | string[])[] };
type ContentTranslation = {
  posts: Record<string, PostTranslation>;
  changelog: Record<string, { title: string; items: string[] }>;
};

export const CONTENT_TRANSLATIONS: Record<Exclude<Locale, "en">, ContentTranslation> = { es, fr, de, pt };

function translatePost(post: Post, locale: Locale): Post {
  const translated = locale === "en" ? undefined : CONTENT_TRANSLATIONS[locale].posts[post.slug];
  if (!translated) return post;
  return {
    ...post,
    title: translated.title,
    summary: translated.summary,
    body: post.body.map((block, i) => {
      const text = translated.blocks[i];
      switch (block.type) {
        case "list":
          return { ...block, items: text as string[] };
        case "samples":
          return { ...block, items: block.items.map((sample, n) => ({ ...sample, caption: (text as string[])[n] })) };
        default:
          return { ...block, text: text as string };
      }
    }),
  };
}

// Newest first. Sorting is stable, so same-day entries keep their order in the file.
const byDate = <T extends { date: string }>(items: T[]) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export async function getPosts(locale: Locale = "en"): Promise<Post[]> {
  return byDate(blog as Post[]).map((post) => translatePost(post, locale));
}

export async function getPost(slug: string, locale: Locale = "en"): Promise<Post | undefined> {
  const post = (blog as Post[]).find((p) => p.slug === slug);
  return post && translatePost(post, locale);
}

export async function getChangelog(locale: Locale = "en"): Promise<ChangelogEntry[]> {
  return byDate(changelog as ChangelogEntry[]).map((entry) => {
    const translated = locale === "en" ? undefined : CONTENT_TRANSLATIONS[locale].changelog[entry.title];
    return translated ? { ...entry, ...translated } : entry;
  });
}

/** A date in the reader's language, fixed to UTC so the build machine's time zone can't change the day. */
export function formatDate(date: string, locale: Locale = "en"): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Where a sample's link goes, before the base path. A sample can name its own language. */
export function sampleHref(sample: PostSample, locale: Locale = "en"): string {
  const query = sample.query ? `?${sample.query}` : "";
  if (sample.kind === "crossStitch") return localePath(sample.locale ?? locale, `/cross-stitch/${query}`);
  if (sample.kind === "tessellation") return localePath(sample.locale ?? locale, `/tessellations/${query}`);
  if (sample.kind === "sashiko") return localePath(sample.locale ?? locale, `/sashiko/${query}`);
  if (sample.kind === "celtic") return localePath(sample.locale ?? locale, `/celtic-knots/${query}`);
  if (sample.kind === "stainedGlass") return localePath(sample.locale ?? locale, `/stained-glass/${query}`);
  if (sample.kind === "mandala") return localePath(sample.locale ?? locale, `/mandalas/${query}`);
  if (sample.kind === "girih") return localePath(sample.locale ?? locale, `/girih/${query}`);
  if (sample.kind === "tartan") return localePath(sample.locale ?? locale, `/tartans/${query}`);
  const section = sample.kind === "block" ? "blocks" : sample.kind === "knit" ? "knitting" : "crochet";
  return localePath(sample.locale ?? locale, `/${section}/${sample.slug}/${query}`);
}
