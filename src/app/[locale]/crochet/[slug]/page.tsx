import { routeLocale } from "@/lib/i18n";
import { StitchView, stitchMetadata, stitchSlugs } from "@/views/StitchViews";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return stitchSlugs("crochet");
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return stitchMetadata(routeLocale(locale), "crochet", slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <StitchView locale={routeLocale(locale)} craft="crochet" slug={slug} />;
}
