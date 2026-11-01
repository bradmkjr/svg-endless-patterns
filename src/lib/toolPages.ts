import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTessellationOptions, type Locale } from "./generator";
import { pageAlternates } from "./i18n";
import { isToolSlug, optionLabel, optionPath, previewOpenGraph, TOOL_OPTIONS, type ToolId } from "./toolOptions";

/** Every choice's name in `locale`, for a generator's thumbnails and headings. */
export async function optionLabels(tool: ToolId, locale: Locale): Promise<Record<string, string>> {
  const tessellation = tool === "tessellation" ? await getTessellationOptions(locale) : undefined;
  return Object.fromEntries(TOOL_OPTIONS[tool].options.map(({ slug }) => [slug, optionLabel(tool, slug, locale, tessellation)]));
}

/** A choice's page: the generator's metadata, named for the choice, with its own canonical URL. */
export async function optionMetadata(tool: ToolId, locale: Locale, slug: string, base: Metadata): Promise<Metadata> {
  if (!isToolSlug(tool, slug)) notFound();
  const label = (await optionLabels(tool, locale))[slug];
  const title = `${label} | ${base.title as string}`;
  const openGraph = previewOpenGraph(tool, slug, title, base.description as string);
  return { ...base, title, alternates: pageAlternates(locale, optionPath(tool, slug)), ...(openGraph ? { openGraph } : {}) };
}
