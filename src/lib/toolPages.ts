import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTessellationOptions, type Locale } from "./generator";
import { fill, messages } from "./i18n";
import { pageMetadata } from "./pageMetadata";
import { isToolSlug, optionLabel, optionPath, TOOL_OPTIONS, type ToolId } from "./toolOptions";

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
  return pageMetadata(locale, optionPath(tool, slug), fill(t.meta.optionTitle, { name, kind }), `${name} (${kind}). ${base.description as string}`);
}
