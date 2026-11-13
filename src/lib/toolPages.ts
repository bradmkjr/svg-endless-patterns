import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTessellationOptions, type Locale } from "./generator";
import { fill, messages } from "./i18n";
import { pageMetadata } from "./pageMetadata";
import { isToolSlug, optionLabel, optionNote, optionPath, TOOL_OPTIONS, type ToolId } from "./toolOptions";

/** Every choice's name in `locale`, for a generator's thumbnails and headings. */
export async function optionLabels(tool: ToolId, locale: Locale): Promise<Record<string, string>> {
  const tessellation = tool === "tessellation" ? await getTessellationOptions(locale) : undefined;
  return Object.fromEntries(TOOL_OPTIONS[tool].options.map(({ slug }) => [slug, optionLabel(tool, slug, locale, tessellation)]));
}

/** A choice's page: the generator's metadata, named for the choice, with its own canonical URL and share card. */
export async function optionMetadata(tool: ToolId, locale: Locale, slug: string, base: Metadata): Promise<Metadata> {
  if (!isToolSlug(tool, slug)) notFound();
  const name = (await optionLabels(tool, locale))[slug];
  // The kind of pattern goes in the title, so a search result says what the page is about on its own.
  const t = messages(locale);
  const kind = t.library.tools[tool].title;
  const note = optionNote(tool, slug, locale);
  const description = note ? withinLength(`${name}: ${note}`, base.description as string) : `${name} (${kind}). ${base.description as string}`;
  return pageMetadata(locale, optionPath(tool, slug), fill(t.meta.optionTitle, { name, kind }), description);
}

/** About what a search result shows of a description. */
const DESCRIPTION_LENGTH = 160;

/** `lead`, then as many whole sentences of `more` as still fit in a search result. */
export function withinLength(lead: string, more: string): string {
  let out = lead;
  for (const sentence of more.split(/(?<=[.!?])\s+/)) {
    if (out.length + 1 + sentence.length > DESCRIPTION_LENGTH) break;
    out = `${out} ${sentence}`;
  }
  return out;
}
