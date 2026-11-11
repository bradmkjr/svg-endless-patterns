"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { PatternTypeLink } from "@/lib/libraryTools";
import styles from "./SiteNav.module.css";

/**
 * The menu button in the header's corner: every pattern type, linked. It's a `<details>`, so it
 * opens without JavaScript; with it, the menu closes on a new page, on Escape and on a click
 * outside, and marks the section you're in.
 */
export function PatternMenu({ label, links }: { label: string; links: PatternTypeLink[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = (event: Event) => {
      const details = menu.current;
      if (!details?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !details.contains(event.target as Node)) {
        details.open = false;
        if (event instanceof KeyboardEvent) details.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("click", close);
    };
  }, []);

  return (
    <details ref={menu} className={styles.menu}>
      <summary aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </summary>
      <nav className={styles.menuPanel} aria-label={label}>
        <p className={styles.menuTitle}>{label}</p>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
