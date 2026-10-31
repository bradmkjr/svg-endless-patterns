import { routeLocale } from "@/lib/i18n";
import { MandalaView, mandalaMetadata } from "@/views/MandalaView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return mandalaMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <MandalaView locale={routeLocale((await params).locale)} />;
}
