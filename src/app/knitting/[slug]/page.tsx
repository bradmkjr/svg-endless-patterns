import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StitchPage } from "@/components/StitchPage";
import { getStitchPattern, getStitchPatterns } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getStitchPatterns("knit")).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stitch = await getStitchPattern("knit", (await params).slug);
  if (!stitch) return {};
  return {
    title: `${stitch.name}: Knit Pattern, Chart & Calculator`,
    description: `${stitch.summary} Enter your size and gauge for row-by-row instructions, a chart and a yarn estimate.`,
    alternates: { canonical: absoluteUrl(`/knitting/${stitch.slug}/`) },
  };
}

export default async function Page({ params }: Props) {
  const stitch = await getStitchPattern("knit", (await params).slug);
  if (!stitch) notFound();
  return <StitchPage stitch={stitch} />;
}
