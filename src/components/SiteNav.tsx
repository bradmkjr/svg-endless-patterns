import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { localePath, messages } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import { LanguageLinks } from "./LanguageLinks";
import styles from "./SiteNav.module.css";

export function SiteNav({ locale }: { locale: Locale }) {
  const t = messages(locale).nav;
  const href = (path: string) => localePath(locale, path);
  return (
    <header className={`${styles.nav} no-print`}>
      {locale !== "en" && <div className="flag-stripe" aria-hidden />}
      <div className={styles.inner}>
        <Link href={href("/")} className={styles.brand}>
          {SITE_NAME}
        </Link>
        <nav className={styles.links} aria-label="Main">
          <Link href={href("/blocks/")}>{t.quilting}</Link>
          <Link href={href("/knitting/")}>{t.knitting}</Link>
          <Link href={href("/crochet/")}>{t.crochet}</Link>
          <Link href={href("/patterns/")}>{t.library}</Link>
          <Link href={href("/blog/")}>{t.blog}</Link>
          <Link href={href("/about/")}>{t.how}</Link>
        </nav>
        <LanguageLinks locale={locale} />
      </div>
    </header>
  );
}
