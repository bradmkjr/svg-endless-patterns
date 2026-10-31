import { routeLocale } from "@/lib/i18n";
import { PatternsView, patternsMetadata } from "@/views/PatternViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return patternsMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <PatternsView locale={routeLocale((await params).locale)} />;
}
