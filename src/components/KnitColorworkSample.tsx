"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sampleHref, type PostSample } from "@/lib/content";
import { generateKnitColorwork, type Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";
import { parseKnitColorworkState } from "@/lib/knitColorworkState";
import copy from "@/i18n/messages/knitColorwork.json";
import styles from "./Blog.module.css";

export function KnitColorworkSample({ sample, locale }: { sample: Extract<PostSample, { kind: "knitColorwork" }>; locale: Locale }) {
  const [generated, setGenerated] = useState<{ key: string; svg: string } | null>(null);
  const [failedKey, setFailedKey] = useState("");
  const t = copy[locale];
  const builder = messages(locale).builder;
  const key = `${sample.query}:${sample.locale ?? locale}:${sample.view}`;
  const svg = generated?.key === key ? generated.svg : "";
  const failed = failedKey === key;

  useEffect(() => {
    let stale = false;
    generateKnitColorwork(parseKnitColorworkState(new URLSearchParams(sample.query), sample.locale ?? locale)).then(
      (result) => {
        if (!stale) setGenerated({ key, svg: result.svg[sample.view] });
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
