import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/Blog.module.css";
import { formatDate, getChangelog } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's changed on Endless Patterns, newest first.",
  alternates: { canonical: absoluteUrl("/changelog/") },
};

export default async function ChangelogPage() {
  const entries = await getChangelog();
  return (
    <div className="page">
      <h1>Changelog</h1>
      <p className="lede">What&apos;s changed on the site, newest first.</p>
      <ol className={styles.entries}>
        {entries.map((entry) => (
          <li key={entry.title}>
            <time className={styles.date} dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
            <h2>{entry.title}</h2>
            <ul>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {entry.post && (
              <p>
                <Link href={`/blog/${entry.post}/`}>Read the blog post</Link>
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
