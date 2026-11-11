import { routeLocale } from "@/lib/i18n";
import { SeasonView, seasonMetadata, seasonIds } from "@/views/SeasonalViews";

type Props = { params: Promise<{ locale: string; season: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return seasonIds();
}

export async function generateMetadata({ params }: Props) {
  const { locale, season } = await params;
  return seasonMetadata(routeLocale(locale), season);
}

export default async function Page({ params }: Props) {
  const { locale, season } = await params;
  return <SeasonView locale={routeLocale(locale)} id={season} />;
}
