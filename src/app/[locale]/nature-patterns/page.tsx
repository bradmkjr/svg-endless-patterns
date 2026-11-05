import { routeLocale } from "@/lib/i18n";
import { NatureView, natureMetadata } from "@/views/NatureView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return natureMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <NatureView locale={routeLocale((await params).locale)} />;
}
