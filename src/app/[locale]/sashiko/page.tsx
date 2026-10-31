import { routeLocale } from "@/lib/i18n";
import { SashikoView, sashikoMetadata } from "@/views/SashikoView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return sashikoMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <SashikoView locale={routeLocale((await params).locale)} />;
}
