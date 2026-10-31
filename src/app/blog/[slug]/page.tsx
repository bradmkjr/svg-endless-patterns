import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/Blog.module.css";
import { PostSamples } from "@/components/PostSamples";
import { RichText } from "@/components/RichText";
import { formatDate, getPost, getPosts } from "@/lib/content";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPosts()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const url = absoluteUrl(`/blog/${post.slug}/`);
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: post.title, description: post.summary, publishedTime: post.date },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: absoluteUrl(`/blog/${post.slug}/`),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  return (
    <article className="page">
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
        <Link href="/blog/">Blog</Link>
      </p>
      <h1 style={{ margin: "0 0 0.5rem", maxWidth: "44rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{post.title}</h1>
      <time className={styles.date} dateTime={post.date}>
        {formatDate(post.date)}
      </time>
      <div className="prose" style={{ marginTop: "1.5rem" }}>
        {post.body.map((block, i) => {
          switch (block.type) {
            case "heading":
              return <h2 key={i}>{block.text}</h2>;
            case "paragraph":
              return (
                <p key={i}>
                  <RichText text={block.text} />
                </p>
              );
            case "list":
              return (
                <ul key={i}>
                  {block.items.map((item) => (
                    <li key={item}>
                      <RichText text={item} />
                    </li>
                  ))}
                </ul>
              );
            case "samples":
              return <PostSamples key={i} items={block.items} />;
          }
        })}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    </article>
  );
}
