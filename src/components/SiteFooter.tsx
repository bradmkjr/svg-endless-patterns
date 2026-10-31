import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={`${styles.footer} no-print`}>
      <div className={styles.inner}>
        <p>Everything you make here is free to download and use. Check measurements before you cut: figures are provided as-is, with no warranty.</p>
        <p className={styles.version}>
          <Link href="/blog/">Blog</Link> · <Link href="/changelog/">Changelog</Link> · v{APP_VERSION}
        </p>
      </div>
    </footer>
  );
}
