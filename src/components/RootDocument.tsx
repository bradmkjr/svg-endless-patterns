import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import type { Locale } from "@/lib/generator";
import { messages, SITE_LOCALES } from "@/lib/i18n";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export function rootMetadata(locale: Locale): Metadata {
  const t = messages(locale).meta;
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: { default: `${SITE_NAME}: ${t.defaultTitle}`, template: `%s | ${SITE_NAME}` },
    description: t.description,
  };
}

/** The page shell for one language. `data-locale` picks its colors in `globals.css`. */
export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { htmlLang } = SITE_LOCALES.find((l) => l.code === locale)!;
  return (
    <html lang={htmlLang} data-locale={locale} className={`${geist.variable} ${fraunces.variable}`}>
      <body>
        <SiteNav locale={locale} />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
