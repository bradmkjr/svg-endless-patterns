import { mazeApiUrl } from "./mazeApi";
import { internalPreviewUrl } from "./previewImages";
import type { CardPicture } from "./socialCards";
import { allThumbs } from "./thumbnails";
import { API_IMAGE_GROUPS, apiThumbPath } from "./toolOptions";

/** Server only: the SVGs share cards are drawn from. Only SVGs, as for every other build picture. */

async function fetchSvg({ group, slug }: CardPicture): Promise<string | null> {
  const internal = !!process.env.API_INTERNAL_URL;
  // A checkout with no API at all still builds, with cards that leave its pictures out.
  if (!internal && !process.env.NEXT_PUBLIC_API_BASE_URL) return null;
  const response = await fetch(internal ? internalPreviewUrl(group, slug) : mazeApiUrl(apiThumbPath(group, slug)));
  // A failure stops the build, rather than publishing cards with missing pictures.
  if (!response.ok) throw new Error(`Share card picture ${group}/${slug}: the API returned ${response.status}`);
  return response.text();
}

async function drawSvg(picture: CardPicture): Promise<string | null> {
  if (API_IMAGE_GROUPS.includes(picture.group)) return fetchSvg(picture);
  const thumb = (await allThumbs()).find((t) => t.group === picture.group && t.slug === picture.slug);
  if (!thumb) throw new Error(`Share card picture ${picture.group}/${picture.slug}: no such thumbnail`);
  return thumb.draw();
}

const pictures = new Map<string, Promise<string | null>>();

/** A picture as a data URI, drawn once however many cards use it. */
export function cardPicture(picture: CardPicture): Promise<string | null> {
  const key = `${picture.group}/${picture.slug}`;
  if (!pictures.has(key)) pictures.set(key, drawSvg(picture).then((svg) => svg && `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`));
  return pictures.get(key)!;
}
