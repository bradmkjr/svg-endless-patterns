import { routeLocale } from "@/lib/i18n";
import { KolamView, kolamMetadata } from "@/views/KolamView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return kolamMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <KolamView locale={routeLocale((await params).locale)} />;
}
