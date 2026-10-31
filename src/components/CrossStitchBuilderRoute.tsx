"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import catalog from "@/i18n/messages/crossStitch.json";
import type { Locale } from "@/lib/generator";
import { localePath } from "@/lib/i18n";
import { parseCrossStitchState } from "@/lib/crossStitchState";
import { legacyNeedlepointQuery } from "@/lib/needlepointState";
import { withOption } from "@/lib/toolOptions";
import { CrossStitchBuilder } from "./CrossStitchBuilder";

/** An old needlepoint share link: goes on to the needlepoint page, with a link in case it can't. */
function OpenInNeedlepoint({ href, locale }: { href: string; locale: Locale }) {
  const router = useRouter();
  useEffect(() => router.replace(href), [router, href]);
  const t = catalog[locale];
  return (
    <p role="status">
      {t.moved} <Link href={href}>{t.movedLink}</Link>
    </p>
  );
}

function FromShareLink({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  const params = useSearchParams();
  const needlepoint = legacyNeedlepointQuery(params, locale);
  if (needlepoint !== null) return <OpenInNeedlepoint href={localePath(locale, needlepoint ? `/needlepoint/?${needlepoint}` : "/needlepoint/")} locale={locale} />;
  return <CrossStitchBuilder locale={locale} option={option} labels={labels} initialState={parseCrossStitchState(withOption("crossStitch", option, params), locale)} />;
}

/** Same arrangement as `BlockBuilderRoute`: default design in the HTML, share link settings on load. */
export function CrossStitchBuilderRoute({ locale, option, labels }: { locale: Locale; option?: string; labels: Record<string, string> }) {
  return (
    <Suspense key={option} fallback={<CrossStitchBuilder locale={locale} option={option} labels={labels} initialState={parseCrossStitchState(withOption("crossStitch", option), locale)} />}>
      <FromShareLink locale={locale} option={option} labels={labels} />
    </Suspense>
  );
}
