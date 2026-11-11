import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { localePath, messages } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import weaving from "@/i18n/messages/weaving.json";
import { patternTypeLinks } from "@/lib/libraryTools";
import { LanguageLinks } from "./LanguageLinks";
import { PatternMenu } from "./PatternMenu";
import styles from "./SiteNav.module.css";

export function SiteNav({ locale }: { locale: Locale }) {
  const t = messages(locale).nav;
  const href = (path: string) => localePath(locale, path);
  return (
    <header className={`${styles.nav} no-print`}>
      {locale !== "en" && <div className="flag-stripe" aria-hidden />}
      {/* A darker band above the menu, on the left, where a browser's own translate prompt doesn't cover it. */}
      <div className={styles.languageBand}>
        <div className={styles.languageInner}>
          <LanguageLinks locale={locale} />
        </div>
      </div>
      <div className={styles.inner}>
        <Link href={href("/")} className={styles.brand}>
          {SITE_NAME}
        </Link>
        <nav className={styles.links} aria-label="Main">
          <Link href={href("/blocks/")}>{t.quilting}</Link>
          <Link href={href("/knitting/")}>{t.knitting}</Link>
          <Link href={href("/crochet/")}>{t.crochet}</Link>
          <Link href={href("/weaving/")}>{weaving[locale].nav}</Link>
          <Link href={href("/paper-puzzles/")}>{t.puzzles}</Link>
          <Link href={href("/seasonal/")}>{t.seasonal}</Link>
          <Link href={href("/patterns/")}>{t.library}</Link>
          <Link href={href("/palettes/")}>{t.palettes}</Link>
          <Link href={href("/blog/")}>{t.blog}</Link>
          <Link href={href("/about/")}>{t.how}</Link>
        </nav>
        <PatternMenu label={t.allPatterns} links={patternTypeLinks(locale)} />
      </div>
    </header>
  );
}
