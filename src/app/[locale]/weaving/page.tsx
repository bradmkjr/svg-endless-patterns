import { routeLocale } from "@/lib/i18n";
import { WeavingView, weavingMetadata } from "@/views/WeavingView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return weavingMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <WeavingView locale={routeLocale((await params).locale)} />;
}
