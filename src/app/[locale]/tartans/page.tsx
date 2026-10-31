import { routeLocale } from "@/lib/i18n";
import { TartanView, tartanMetadata } from "@/views/TartanView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return tartanMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <TartanView locale={routeLocale((await params).locale)} />;
}
