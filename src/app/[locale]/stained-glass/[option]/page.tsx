import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { StainedGlassView, stainedGlassMetadata } from "@/views/StainedGlassView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("stainedGlass");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("stainedGlass", routeLocale(locale), option, stainedGlassMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <StainedGlassView locale={routeLocale(locale)} option={option} />;
}
