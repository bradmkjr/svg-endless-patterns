import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { ChineseLatticeView, chineseLatticeMetadata } from "@/views/ChineseLatticeView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("chineseLattice");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("chineseLattice", routeLocale(locale), option, chineseLatticeMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <ChineseLatticeView locale={routeLocale(locale)} option={option} />;
}
