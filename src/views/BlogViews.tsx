import type { Metadata } from "next";
import { pageMetadata } from "@/lib/pageMetadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/Blog.module.css";
import { PostSamples } from "@/components/PostSamples";
import { RichText } from "@/components/RichText";
import { formatDate, getChangelog, getPost, getPosts } from "@/lib/content";
import type { Locale } from "@/lib/generator";
import { localePath, messages } from "@/lib/i18n";
import { postImage } from "@/lib/postImages";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export function blogMetadata(locale: Locale): Metadata {
  const t = messages(locale).blog;
  return pageMetadata(locale, "/blog/", t.metaTitle, t.metaDesc);
}

export async function BlogView({ locale }: { locale: Locale }) {
  const t = messages(locale).blog;
  const posts = await getPosts(locale);
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">
        {t.ledeBefore}
        <Link href={localePath(locale, "/changelog/")}>{t.ledeLink}</Link>
        {t.ledeAfter}
      </p>
      <ul className={styles.posts}>
        {posts.map((post) => (
          <li key={post.slug} className={styles.post}>
            {/* The title beside it is the link's name, so screen readers skip this one. */}
            <Link href={localePath(locale, `/blog/${post.slug}/`)} className={styles.featured} tabIndex={-1} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- a small static file or API thumbnail, loaded as it nears the screen */}
              <img src={postImage(post)} alt="" loading="lazy" width={200} height={200} />
            </Link>
            <div>
              <time className={styles.date} dateTime={post.date}>
                {formatDate(post.date, locale)}
              </time>
              <h2>
                <Link href={localePath(locale, `/blog/${post.slug}/`)}>{post.title}</Link>
              </h2>
              <p>{post.summary}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function postSlugs() {
  return (await getPosts()).map(({ slug }) => ({ slug }));
}

export async function postMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const post = await getPost(slug, locale);
  if (!post) return {};
  const path = `/blog/${post.slug}/`;
  return pageMetadata(locale, path, post.title, post.summary, { type: "article", publishedTime: post.date });
}

export async function PostView({ locale, slug }: { locale: Locale; slug: string }) {
  const post = await getPost(slug, locale);
  if (!post) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    inLanguage: locale === "pt" ? "pt-BR" : locale,
    datePublished: post.date,
    url: absoluteUrl(localePath(locale, `/blog/${post.slug}/`)),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  return (
    <article className="page">
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
        <Link href={localePath(locale, "/blog/")}>{messages(locale).blog.back}</Link>
      </p>
      <h1 style={{ margin: "0 0 0.5rem", maxWidth: "44rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{post.title}</h1>
      <time className={styles.date} dateTime={post.date}>
        {formatDate(post.date, locale)}
      </time>
      <div className="prose" style={{ marginTop: "1.5rem" }}>
        {post.body.map((block, i) => {
          switch (block.type) {
            case "heading":
              return <h2 key={i}>{block.text}</h2>;
            case "paragraph":
              return (
                <p key={i}>
                  <RichText text={block.text} locale={locale} />
                </p>
              );
            case "list":
              return (
                <ul key={i}>
                  {block.items.map((item) => (
                    <li key={item}>
                      <RichText text={item} locale={locale} />
                    </li>
                  ))}
                </ul>
              );
            case "samples":
              return <PostSamples key={i} items={block.items} locale={locale} />;
          }
        })}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    </article>
  );
}

export function changelogMetadata(locale: Locale): Metadata {
  const t = messages(locale).changelog;
  return pageMetadata(locale, "/changelog/", t.metaTitle, t.metaDesc);
}

export async function ChangelogView({ locale }: { locale: Locale }) {
  const t = messages(locale).changelog;
  const entries = await getChangelog(locale);
  return (
    <div className="page">
      <h1>{t.h1}</h1>
      <p className="lede">{t.lede}</p>
      <ol className={styles.entries}>
        {entries.map((entry) => (
          <li key={entry.title}>
            <time className={styles.date} dateTime={entry.date}>
              {formatDate(entry.date, locale)}
            </time>
            <h2>{entry.title}</h2>
            <ul>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {entry.post && (
              <p>
                <Link href={localePath(locale, `/blog/${entry.post}/`)}>{t.readPost}</Link>
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
