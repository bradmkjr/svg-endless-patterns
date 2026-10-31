import Link from "next/link";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Post text: plain words plus [label](path) links, so posts stay plain JSON. */
export function RichText({ text, locale }: { text: string; locale: Locale }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    parts.push(text.slice(last, match.index));
    const [whole, label, href] = match;
    parts.push(
      href.startsWith("/") ? (
        <Link key={match.index} href={localePath(locale, href)}>
          {label}
        </Link>
      ) : (
        <a key={match.index} href={href} rel="noopener noreferrer">
          {label}
        </a>
      ),
    );
    last = match.index + whole.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
