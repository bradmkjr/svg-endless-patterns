import type { Locale } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { previewSrc, type ThumbGroup } from "@/lib/toolOptions";

/**
 * A tool's opening design as a real image in the static HTML. The builder draws in the
 * browser, so this is what search engines see. Absent from builds with no `API_INTERNAL_URL`.
 */
export function StaticPreview({ group, slug, name, locale }: { group: ThumbGroup; slug: string; name: string; locale: Locale }) {
  const src = previewSrc(group, slug);
  if (!src) return null;
  return (
    <figure className="no-print" style={{ maxWidth: "24rem", margin: "2rem 0 0" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static file made at build time */}
      <img src={src} alt={name} loading="lazy" width={1200} height={1200} style={{ display: "block", width: "100%", height: "auto", borderRadius: 3 }} />
      <figcaption style={{ marginTop: "0.4rem", color: "var(--muted)", fontSize: "0.9rem" }}>{fill(messages(locale).builder.exampleCaption, { name })}</figcaption>
    </figure>
  );
}
