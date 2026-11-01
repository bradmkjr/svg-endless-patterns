import { imageList, internalPngUrl, internalPreviewUrl } from "@/lib/previewImages";

type Props = { params: Promise<{ group: string; slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

/**
 * With no internal API to ask, pages use the public API as before. An export can't have a route
 * with no pages, so this leaves one empty placeholder file that nothing links to.
 */
const PLACEHOLDER = { group: "none", slug: "none.svg" };

export function generateStaticParams() {
  if (!process.env.API_INTERNAL_URL) return [PLACEHOLDER];
  return imageList().flatMap(({ group, slug }) => [{ group, slug: `${slug}.svg` }, { group, slug: `${slug}.png` }]);
}

export async function GET(_request: Request, { params }: Props) {
  const { group, slug } = await params;
  if (group === PLACEHOLDER.group) return new Response(null, { headers: { "Content-Type": "image/svg+xml" } });
  // A failure stops the build, rather than publishing pages with missing pictures.
  const png = slug.endsWith(".png");
  const response = await fetch(png ? internalPngUrl(group, slug) : internalPreviewUrl(group, slug));
  if (!response.ok) throw new Error(`Picture ${group}/${slug}: the internal API returned ${response.status}`);
  return new Response(await response.arrayBuffer(), { headers: { "Content-Type": png ? "image/png" : "image/svg+xml" } });
}
