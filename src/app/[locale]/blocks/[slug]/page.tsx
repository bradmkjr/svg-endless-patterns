import { routeLocale } from "@/lib/i18n";
import { BlockView, blockMetadata, blockSlugs } from "@/views/BlockViews";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blockSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return blockMetadata(routeLocale(locale), slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <BlockView locale={routeLocale(locale)} slug={slug} />;
}
