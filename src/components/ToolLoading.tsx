"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/generator";
import copy from "@/i18n/messages/apiStatus.json";
import { primaryImageSrc, type ThumbGroup } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

const PrimaryImage = createContext<{ src: string; alt: string } | null>(null);

/** Names the pattern whose PNG stands in for the builder's preview. */
export function PrimaryImageProvider({ group, slug, name, children }: { group: ThumbGroup; slug: string; name: string; children: ReactNode }) {
  const src = primaryImageSrc(group, slug);
  return <PrimaryImage.Provider value={src ? { src, alt: name } : null}>{children}</PrimaryImage.Provider>;
}

/**
 * Stands in for a preview until the API's first answer. This is what's in the static HTML,
 * so it's a plain image for search engines. The API draws it when it's requested, not at build.
 */
export function ToolLoading({ locale }: { locale: Locale }) {
  const image = useContext(PrimaryImage);
  if (!image) return <p className={styles.note}>{copy[locale].loading}</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a standard image tag, so bots can index it
    <img className={styles.primaryImage} src={image.src} alt={image.alt} width={1200} height={1200} />
  );
}
