import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { MandalaView, mandalaMetadata } from "@/views/MandalaView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("mandala");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("mandala", routeLocale(locale), option, mandalaMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <MandalaView locale={routeLocale(locale)} option={option} />;
}
