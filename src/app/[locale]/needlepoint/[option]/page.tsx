import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { NeedlepointView, needlepointMetadata } from "@/views/NeedlepointView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("needlepoint");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("needlepoint", routeLocale(locale), option, needlepointMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <NeedlepointView locale={routeLocale(locale)} option={option} />;
}
