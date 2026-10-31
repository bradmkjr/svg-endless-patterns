import { allThumbs } from "@/lib/thumbnails";

type Props = { params: Promise<{ tool: string; slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await allThumbs()).map((thumb) => ({ tool: thumb.group, slug: `${thumb.slug}.svg` }));
}

export async function GET(_request: Request, { params }: Props) {
  const { tool, slug } = await params;
  const thumb = (await allThumbs()).find((t) => t.group === tool && `${t.slug}.svg` === slug);
  if (!thumb) return new Response(null, { status: 404 });
  return new Response(await thumb.draw(), { headers: { "Content-Type": "image/svg+xml" } });
}
