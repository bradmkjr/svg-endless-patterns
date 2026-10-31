import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { localePath, messages } from "@/lib/i18n";
import { APP_VERSION } from "@/lib/version";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = messages(locale).footer;
  return (
    <footer className={`${styles.footer} no-print`}>
      <div className={styles.inner}>
        <p>
          {t.note}
          {t.draft && ` ${t.draft}`}
        </p>
        <p className={styles.version}>
          <Link href={localePath(locale, "/blog/")}>{t.blog}</Link> · <Link href={localePath(locale, "/changelog/")}>{t.changelog}</Link> · v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
