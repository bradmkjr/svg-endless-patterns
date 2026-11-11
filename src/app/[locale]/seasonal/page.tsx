import { routeLocale } from "@/lib/i18n";
import { SeasonalView, seasonalMetadata } from "@/views/SeasonalViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return seasonalMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <SeasonalView locale={routeLocale((await params).locale)} />;
}
