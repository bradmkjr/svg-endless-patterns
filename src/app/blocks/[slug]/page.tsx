import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockBuilderRoute } from "@/components/BlockBuilderRoute";
import { generatePattern, getBlock, getBlocks } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";
import { defaultState } from "@/lib/state";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getBlocks()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const block = await getBlock((await params).slug);
  if (!block) return {};
  return {
    title: `${block.name} Quilt Block: Cutting List & Templates`,
    description: `${block.summary} Set your own size and colors for a cutting list, yardage and printable templates.`,
    alternates: { canonical: absoluteUrl(`/blocks/${block.slug}/`) },
  };
}

export default async function BlockPage({ params }: Props) {
  const block = await getBlock((await params).slug);
  if (!block) notFound();
  const initial = await generatePattern(block.slug, defaultState(block));

  return (
    <div className="page">
      <p className="no-print" style={{ margin: "0 0 0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        <Link href="/blocks/">Quilt blocks</Link> / {block.family}
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{block.name}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {block.summary}
      </p>
      <BlockBuilderRoute block={block} initial={initial} />
    </div>
  );
}
