import { routeLocale } from "@/lib/i18n";
import { PaletteView, paletteMetadata } from "@/views/PaletteView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return paletteMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <PaletteView locale={routeLocale((await params).locale)} />;
}
