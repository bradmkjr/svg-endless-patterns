import { routeLocale } from "@/lib/i18n";
import { StitchView, stitchMetadata, stitchSlugs } from "@/views/StitchViews";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return stitchSlugs("knit");
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return stitchMetadata(routeLocale(locale), "knit", slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <StitchView locale={routeLocale(locale)} craft="knit" slug={slug} />;
}
