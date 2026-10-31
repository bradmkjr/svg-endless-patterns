import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { CrochetColorworkView, crochetColorworkMetadata } from "@/views/CrochetColorworkViews";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("crochetColorwork");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("crochetColorwork", routeLocale(locale), option, crochetColorworkMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <CrochetColorworkView locale={routeLocale(locale)} option={option} />;
}
