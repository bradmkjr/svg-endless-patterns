import type { Metadata } from "next";
import Link from "next/link";
import { PuzzleBuilderRoute } from "@/components/PuzzleBuilderRoute";
import { PrimaryImageProvider } from "@/components/ToolLoading";
import gridStyles from "@/components/BlockGrid.module.css";
import copy from "@/i18n/messages/puzzle.json";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/pageMetadata";
import { PUZZLE_OPTIONS } from "@/lib/puzzleState";
import { optionPath, thumbSrc } from "@/lib/toolOptions";
import { optionLabels } from "@/lib/toolPages";

export function puzzleMetadata(locale: Locale): Metadata {
  const t = copy[locale];
  return pageMetadata(locale, "/paper-puzzles/", t.metaTitle, t.metaDesc);
}

/** Everything under the menu's paper puzzles: this tool's sheets, and the mazes, which keep their own pages. */
export function PuzzleHubView({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const cards = [
    ...PUZZLE_OPTIONS.map((id) => ({ key: id, name: t.types[id], text: t.blurbs[id], href: localePath(locale, optionPath("puzzle", id)), src: thumbSrc("puzzle", id) })),
    { key: "mazes", name: t.mazes, text: t.blurbs.mazes, href: localePath(locale, "/mazes/"), src: thumbSrc("maze", "square") },
  ];
  return (
    <div className="page">
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{t.h1}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.lede}
      </p>
      <h2>{t.puzzlesHeading}</h2>
      <ul className={gridStyles.grid}>
        {cards.map((card) => (
          <li key={card.key}>
            <Link href={card.href} className={gridStyles.card}>
              <span className={`art ${gridStyles.art}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a small file, loaded as it nears the screen */}
                <img src={card.src} alt="" loading="lazy" width={200} height={200} />
              </span>
              <span className={gridStyles.name}>{card.name}</span>
              <span className={gridStyles.level}>{card.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function PuzzleView({ locale, option }: { locale: Locale; option: string }) {
  const t = copy[locale];
  const labels = await optionLabels("puzzle", locale);
  return (
    <div className="page">
      <p style={{ margin: "0 0 0.25rem" }}>
        <Link href={localePath(locale, "/paper-puzzles/")}>{t.allPuzzles}</Link>
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{labels[option]}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {t.blurbs[option as keyof typeof t.blurbs]}
      </p>
      <PrimaryImageProvider group="puzzle" slug={option} name={labels[option]}>
        <PuzzleBuilderRoute option={option} labels={labels} locale={locale} />
      </PrimaryImageProvider>
    </div>
  );
}
