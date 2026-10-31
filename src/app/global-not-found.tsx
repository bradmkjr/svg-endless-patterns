import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { MESSAGES, SITE_LOCALES, localePath } from "@/lib/i18n";

export const metadata: Metadata = { title: "Not found" };

/** Unmatched URLs carry no language, so this offers the way back in each one. */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="page prose">
            {SITE_LOCALES.map(({ code, htmlLang }) => {
              const t = MESSAGES[code].notFound;
              return (
                <p key={code} lang={htmlLang}>
                  <strong>{t.title}.</strong> {t.before}
                  <Link href={localePath(code, "/blocks/")}>{t.link}</Link>
                  {t.after}
                </p>
              );
            })}
          </div>
        </main>
      </body>
    </html>
  );
}
