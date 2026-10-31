import { routeLocale } from "@/lib/i18n";
import { PatternView, patternMetadata, patternSlugs } from "@/views/PatternViews";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return patternSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return patternMetadata(routeLocale(locale), slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <PatternView locale={routeLocale(locale)} slug={slug} />;
}
