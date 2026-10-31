import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/Blog.module.css";
import { formatDate, getPosts } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: "New pattern tools and features, with samples you can open and change.",
  alternates: { canonical: absoluteUrl("/blog/") },
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <div className="page">
      <h1>Blog</h1>
      <p className="lede">
        New tools and features, with samples you can open and change. For the full list of updates, see the <Link href="/changelog/">changelog</Link>.
      </p>
      <ul className={styles.posts}>
        {posts.map((post) => (
          <li key={post.slug}>
            <time className={styles.date} dateTime={post.date}>
              {formatDate(post.date)}
            </time>
            <h2>
              <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
            </h2>
            <p>{post.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
