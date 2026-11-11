import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { OrigamiTessellationView, origamiTessellationMetadata } from "@/views/OrigamiTessellationView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("origamiTessellation");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("origamiTessellation", routeLocale(locale), option, origamiTessellationMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <OrigamiTessellationView locale={routeLocale(locale)} option={option} />;
}
