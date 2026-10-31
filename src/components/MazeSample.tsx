"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import { generateMaze, type Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";
import { parseMazeState } from "@/lib/mazeState";
import copy from "@/i18n/messages/maze.json";
import styles from "./Blog.module.css";

export function MazeSample({ sample, locale }: { sample: Extract<PostSample, { kind: "maze" }>; locale: Locale }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const t = copy[locale];
  const builder = messages(locale).builder;

  useEffect(() => {
    let stale = false;
    setSvg("");
    setFailed(false);
    generateMaze(parseMazeState(new URLSearchParams(sample.query), sample.locale ?? locale)).then(
      (result) => {
        if (!stale) setSvg(result.svg[sample.view]);
      },
      () => {
        if (!stale) setFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [locale, sample]);

  return (
    <li>
      <Link href={sampleHref(sample, locale)} className={styles.sample}>
        {svg ? (
          <span className={`art ${styles.sampleArt}`} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span className={`art ${styles.sampleArt}`} role="status">{failed ? builder.updateError : t.loading}</span>
        )}
        <span className={styles.caption}>{sample.caption}</span>
        <span className={styles.open}>{messages(locale).blog.openSample}</span>
      </Link>
    </li>
  );
}
