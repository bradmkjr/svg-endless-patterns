import { routeLocale } from "@/lib/i18n";
import { PostView, postMetadata, postSlugs } from "@/views/BlogViews";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return postSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  return postMetadata(routeLocale(locale), slug);
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <PostView locale={routeLocale(locale)} slug={slug} />;
}
