import { imageList, internalPreviewUrl, PREVIEW_SIZES } from "@/lib/previewImages";

type Props = { params: Promise<{ size: string; group: string; slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

/** With no internal API to ask, there's nothing to save, and pages use the public API as before. */
export function generateStaticParams() {
  if (!process.env.API_INTERNAL_URL) return [];
  return PREVIEW_SIZES.flatMap((size) => imageList().map(({ group, slug }) => ({ size: String(size), group, slug: `${slug}.png` })));
}

export async function GET(_request: Request, { params }: Props) {
  const { size, group, slug } = await params;
  // A failure stops the build, rather than publishing pages with missing pictures.
  const response = await fetch(internalPreviewUrl(group, slug, size));
  if (!response.ok) throw new Error(`Preview ${group}/${slug} at ${size}: the internal API returned ${response.status}`);
  return new Response(await response.arrayBuffer(), { headers: { "Content-Type": "image/png" } });
}
