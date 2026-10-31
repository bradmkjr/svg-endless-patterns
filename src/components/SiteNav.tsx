import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import styles from "./SiteNav.module.css";

export function SiteNav() {
  return (
    <header className={`${styles.nav} no-print`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          {SITE_NAME}
        </Link>
        <nav className={styles.links} aria-label="Main">
          <Link href="/blocks/">Quilting</Link>
          <Link href="/knitting/">Knitting</Link>
          <Link href="/crochet/">Crochet</Link>
          <Link href="/patterns/">Pattern library</Link>
          <Link href="/about/">How it works</Link>
        </nav>
      </div>
    </header>
  );
}
