import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import "@/app/globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import type { Locale } from "@/lib/generator";
import { messages, SITE_LOCALES } from "@/lib/i18n";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { thumbSrc } from "@/lib/toolOptions";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
/** Headings and the site's name. Its optical size axis draws large headings with display proportions. */
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], axes: ["opsz"] });

export function rootMetadata(locale: Locale): Metadata {
  const t = messages(locale).meta;
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: { default: `${SITE_NAME}: ${t.defaultTitle}`, template: `%s | ${SITE_NAME}` },
    description: t.description,
  };
}

/** The faint repeats either side of the page, in `globals.css`: seamless thumbnails, one per side. */
const WALLPAPER = {
  "--wallpaper-start": `url("${thumbSrc("truchet", "arcs")}")`,
  "--wallpaper-end": `url("${thumbSrc("tessellation", "p4")}")`,
} as React.CSSProperties;

/** Google AdSense publisher ID; `public/ads.txt` lists the same account. */
const ADSENSE_CLIENT = "ca-pub-8989714718895680";

/** The page shell for one language. `data-locale` picks its colors in `globals.css`. */
export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { htmlLang } = SITE_LOCALES.find((l) => l.code === locale)!;
  return (
    <html lang={htmlLang} data-locale={locale} className={`${geist.variable} ${newsreader.variable}`}>
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router root layouts render <head> directly */}
      <head>
        {/* A plain tag, not next/script: AdSense rejects the data-nscript attribute it adds. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <SiteNav locale={locale} />
        <main style={WALLPAPER}>{children}</main>
        <SiteFooter locale={locale} />
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
