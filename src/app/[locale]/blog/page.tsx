import { routeLocale } from "@/lib/i18n";
import { BlogView, blogMetadata } from "@/views/BlogViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return blogMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <BlogView locale={routeLocale((await params).locale)} />;
}
