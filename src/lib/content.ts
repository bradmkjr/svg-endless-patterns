/**
 * The site's only door to blog posts and the changelog. They're JSON files
 * today; to move to a database, replace these function bodies with queries.
 * Everything is already async and JSON-shaped, so no caller has to change.
 */
import blog from "@/content/blog.json";
import changelog from "@/content/changelog.json";

/** A sample in a post: a live pattern, and the deep link that opens it with these settings. */
export type PostSample =
  | { kind: "block"; slug: string; query: string; view: "block" | "quilt" | "tile"; caption: string }
  | { kind: "knit" | "crochet"; slug: string; query: string; view: "swatch" | "chart"; caption: string };

export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "samples"; items: PostSample[] };

export type Post = { slug: string; title: string; date: string; summary: string; body: PostBlock[] };

export type ChangelogEntry = { date: string; title: string; items: string[]; post?: string };

// Newest first. Sorting is stable, so same-day entries keep their order in the file.
const byDate = <T extends { date: string }>(items: T[]) => [...items].sort((a, b) => b.date.localeCompare(a.date));

export async function getPosts(): Promise<Post[]> {
  return byDate(blog as Post[]);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (blog as Post[]).find((post) => post.slug === slug);
}

export async function getChangelog(): Promise<ChangelogEntry[]> {
  return byDate(changelog as ChangelogEntry[]);
}

/** "October 30, 2026", fixed to UTC so the build machine's time zone can't change the day. */
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** Where a sample's link goes, before the base path. */
export function sampleHref(sample: PostSample): string {
  const section = sample.kind === "block" ? "blocks" : sample.kind === "knit" ? "knitting" : "crochet";
  return `/${section}/${sample.slug}/${sample.query ? `?${sample.query}` : ""}`;
}
