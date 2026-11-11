import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostSamples } from "@/components/PostSamples";
import type { PostSample } from "@/lib/content";
import type { Locale } from "@/lib/generator";
import { fill, localePath } from "@/lib/i18n";
import { pageMetadata, type CardPicture } from "@/lib/pageMetadata";
import { getSeason, SEASONS, seasonSamples, type Season, type SeasonSample } from "@/lib/seasons";
import copy from "@/i18n/messages/seasonal.json";

/** Share cards show a pattern every season page has: the cross-stitch snowflake for winter. */
const PICTURES: Record<Season["id"], CardPicture> = { winter: { group: "crossStitch", slug: "snowflake" } };

const seasonText = (locale: Locale, season: Season) => copy[locale].seasons[season.id];

/** A season's samples, captioned in the reader's language. */
function captioned(locale: Locale, season: Season, samples: SeasonSample[]): PostSample[] {
  const captions: Record<string, string> = seasonText(locale, season).samples;
  return samples.map(({ id, ...sample }) => ({ ...sample, caption: captions[id] }) as PostSample);
}

export function seasonalMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/seasonal/", t.metaTitle, t.metaDesc, { picture: PICTURES.winter });
}

export function SeasonalView({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      {SEASONS.map((season) => {
        const s = seasonText(locale, season);
        const href = localePath(locale, `/seasonal/${season.id}/`);
        const all = seasonSamples(season);
        return (
          <section key={season.id} style={{ marginTop: "2rem" }}>
            <h2>
              <Link href={href}>{s.name}</Link>
            </h2>
            <p>{s.summary}</p>
            <PostSamples items={captioned(locale, season, all.filter((sample) => season.featured.includes(sample.id)))} locale={locale} />
            <p>
              <Link href={href}>{fill(t.seeAll, { n: all.length })}</Link>
            </p>
          </section>
        );
      })}
    </div>
  );
}

export const seasonIds = () => SEASONS.map(({ id }) => ({ season: id }));

export function seasonMetadata(locale: Locale, id: string): Metadata {
  const season = getSeason(id);
  if (!season) return {};
  const s = seasonText(locale, season);
  return pageMetadata(locale, `/seasonal/${season.id}/`, s.metaTitle, s.metaDesc, { picture: PICTURES[season.id] });
}

export function SeasonView({ locale, id }: { locale: Locale; id: string }) {
  const season = getSeason(id);
  if (!season) notFound();
  const t = copy[locale];
  const s = seasonText(locale, season);
  const groups: Record<string, { heading: string; text: string }> = s.groups;
  return (
    <div className="page">
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
        <Link href={localePath(locale, "/seasonal/")}>{t.breadcrumb}</Link>
      </p>
      <h1>{s.h1}</h1>
      <p className="lede">{s.lede}</p>
      {season.groups.map((group) => (
        <section key={group.id} style={{ marginTop: "2rem" }}>
          <h2>{groups[group.id].heading}</h2>
          <p style={{ maxWidth: "44rem" }}>{groups[group.id].text}</p>
          <PostSamples items={captioned(locale, season, group.samples)} locale={locale} />
        </section>
      ))}
    </div>
  );
}
