import { routeLocale } from "@/lib/i18n";
import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { MazeView, mazeMetadata } from "@/views/MazeView";

type Props = { params: Promise<{ locale: string; option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("maze");
}

export async function generateMetadata({ params }: Props) {
  const { locale, option } = await params;
  return optionMetadata("maze", routeLocale(locale), option, mazeMetadata(routeLocale(locale)));
}

export default async function Page({ params }: Props) {
  const { locale, option } = await params;
  return <MazeView locale={routeLocale(locale)} option={option} />;
}
