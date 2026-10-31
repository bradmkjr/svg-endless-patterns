import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatternDetail } from "@/components/PatternLibrary";
import { getPatternPage, PATTERN_PAGES } from "@/lib/patternPages";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PATTERN_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getPatternPage((await params).slug);
  if (!page) return {};
  return {
    title: page.title,
    description: `${page.summary} Customize ${page.customize.toLowerCase()} Planned output: ${page.output}`,
    alternates: { canonical: absoluteUrl(`/patterns/${page.slug}/`) },
    // Nothing to use here yet: remove when the tool ships, and add it to the sitemap.
    robots: { index: false, follow: true },
  };
}

export default async function PatternPage({ params }: Props) {
  const { slug } = await params;
  const page = getPatternPage(slug);
  if (!page) notFound();
  return <PatternDetail page={page} />;
}
