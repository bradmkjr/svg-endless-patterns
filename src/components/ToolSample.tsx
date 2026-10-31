"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import type { Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";
import { drawSample } from "@/lib/toolSamples";
import copy from "@/i18n/messages/apiStatus.json";
import styles from "./Blog.module.css";

/** A blog sample the API draws, from the same settings its link opens with. */
export function ToolSample({ sample, locale }: { sample: PostSample; locale: Locale }) {
  const [drawn, setDrawn] = useState<{ key: string; svg: string } | null>(null);
  const [failedKey, setFailedKey] = useState("");
  const key = `${sample.kind}:${sample.query}:${sample.locale ?? locale}:${sample.view}`;
  const svg = drawn?.key === key ? drawn.svg : "";

  useEffect(() => {
    let stale = false;
    drawSample(sample, sample.locale ?? locale).then(
      (next) => {
        if (!stale) setDrawn({ key, svg: next });
      },
      () => {
        if (!stale) setFailedKey(key);
      },
    );
    return () => {
      stale = true;
    };
  }, [key, locale, sample]);

  return (
    <li>
      <Link href={sampleHref(sample, locale)} className={styles.sample}>
        {!svg ? (
          <span className={`art ${styles.sampleArt}`} role="status">{failedKey === key ? messages(locale).builder.updateError : copy[locale].loading}</span>
        ) : sample.view === "swatch" ? (
          // A swatch is a small repeating tile: show 4" of it, as the stitch pages do.
          <span
            className={styles.sampleArt}
            style={{
              aspectRatio: "1",
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
              backgroundSize: `${(Number(/viewBox="0 0 ([\d.]+) /.exec(svg)?.[1] ?? 4) / 4) * 100}% auto`,
            }}
          />
        ) : (
          <span className={`art ${styles.sampleArt}`} dangerouslySetInnerHTML={{ __html: svg }} />
        )}
        <span className={styles.caption}>{sample.caption}</span>
        <span className={styles.open}>{messages(locale).blog.openSample}</span>
      </Link>
    </li>
  );
}
