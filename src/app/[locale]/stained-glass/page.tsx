import { routeLocale } from "@/lib/i18n";
import { StainedGlassView, stainedGlassMetadata } from "@/views/StainedGlassView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return stainedGlassMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <StainedGlassView locale={routeLocale((await params).locale)} />;
}
