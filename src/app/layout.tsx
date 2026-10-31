import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `${SITE_NAME}: Quilt, Knitting & Crochet Pattern Calculators`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Customize traditional quilt blocks and knit and crochet stitch patterns for your size and gauge. Get cutting lists, written instructions, charts and printable PDFs, free.",
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable}`}>
      <body>
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
