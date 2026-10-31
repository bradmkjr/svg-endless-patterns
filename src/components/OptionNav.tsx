"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/generator";
import { messages } from "@/lib/i18n";
import { optionHref, thumbSrc, TOOL_OPTIONS, type ToolId } from "@/lib/toolOptions";
import css from "./OptionNav.module.css";

/** Goes to a choice's own page, keeping the other settings from the address bar. */
export function useOptionNavigation(tool: ToolId, locale: Locale) {
  const router = useRouter();
  return (slug: string) => router.push(optionHref(tool, locale, slug, window.location.search));
}

/** Thumbnails of a generator's main choice. Plain links in the HTML, so each page can be found. */
export function OptionNav({ tool, locale, current, labels }: { tool: ToolId; locale: Locale; current: string | undefined; labels: Record<string, string> }) {
  const go = useOptionNavigation(tool, locale);
  const heading = messages(locale).builder.browseOptions;
  return (
    <nav className={`${css.nav} no-print`} aria-label={heading}>
      <ul>
        {TOOL_OPTIONS[tool].options.map(({ slug }) => (
          <li key={slug}>
            <Link
              href={optionHref(tool, locale, slug)}
              aria-current={slug === current ? "page" : undefined}
              className={slug === current ? css.on : css.option}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                go(slug);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a static file, sized by the card */}
              <img src={thumbSrc(tool, slug)} alt="" loading="lazy" width={96} height={96} />
              <span>{labels[slug]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
