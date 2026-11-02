import { routeLocale } from "@/lib/i18n";
import { MandalaView, mandalaOptionMetadata, mandalaStaticParams } from "@/views/MandalaView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return mandalaStaticParams();
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return mandalaOptionMetadata(routeLocale(locale), option);
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <MandalaView locale={routeLocale(locale)} option={option} />;
}
