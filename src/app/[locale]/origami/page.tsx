import { routeLocale } from "@/lib/i18n";
import { OrigamiView, origamiMetadata } from "@/views/OrigamiView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return origamiMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <OrigamiView locale={routeLocale((await params).locale)} />;
}
