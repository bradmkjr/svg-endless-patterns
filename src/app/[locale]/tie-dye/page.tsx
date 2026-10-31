import { routeLocale } from "@/lib/i18n";
import { TieDyeView, tieDyeMetadata } from "@/views/TieDyeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return tieDyeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <TieDyeView locale={routeLocale((await params).locale)} />;
}
