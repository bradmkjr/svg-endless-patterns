import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockBuilderRoute } from "@/components/BlockBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import { BlockGrid } from "@/components/BlockGrid";
import type { Locale } from "@/lib/generator";
import { getBlock, getBlocks } from "@/lib/patternCatalog";
import { fill, localePath, messages } from "@/lib/i18n";

export function blocksMetadata(locale: Locale): Metadata {
  const t = messages(locale).blocks;
  return pageMetadata(locale, "/blocks/", t.metaTitle, t.metaDesc);
}

export async function BlocksView({ locale }: { locale: Locale }) {
  const t = messages(locale).blocks;
  const blocks = await getBlocks(locale);
  const families = [...new Set(blocks.map((b) => b.family))];
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{fill(t.lede, { n: blocks.length })}</p>
      {families.map((family) => (
        <section key={family}>
          <h2>{family}</h2>
          <BlockGrid blocks={blocks.filter((b) => b.family === family)} locale={locale} />
        </section>
      ))}
    </div>
  );
}

export async function blockSlugs() {
  return (await getBlocks()).map(({ slug }) => ({ slug }));
}

export async function blockMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const block = await getBlock(slug, locale);
  if (!block) return {};
  const t = messages(locale).blocks;
  return pageMetadata(locale, `/blocks/${block.slug}/`, fill(t.pageTitle, { name: block.name }), fill(t.pageDesc, { summary: block.summary }));
}

export async function BlockView({ locale, slug }: { locale: Locale; slug: string }) {
  const block = await getBlock(slug, locale);
  if (!block) notFound();
  return (
    <div className="page">
      <p className="no-print" style={{ margin: "0 0 0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        <Link href={localePath(locale, "/blocks/")}>{messages(locale).blocks.breadcrumb}</Link> / {block.family}
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{block.name}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {block.summary}
      </p>
      <PrimaryImageProvider group="blocks" slug={block.slug} name={block.name}>
        <BlockBuilderRoute block={block} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
