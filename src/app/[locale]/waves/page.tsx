import { routeLocale } from "@/lib/i18n";
import { WavesView, wavesMetadata } from "@/views/WavesView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return wavesMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <WavesView locale={routeLocale((await params).locale)} />;
}
