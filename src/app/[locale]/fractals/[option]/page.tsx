import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { FractalView, fractalMetadata } from "@/views/FractalView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("fractal");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("fractal", routeLocale(locale), option, fractalMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <FractalView locale={routeLocale(locale)} option={option} />;
}
