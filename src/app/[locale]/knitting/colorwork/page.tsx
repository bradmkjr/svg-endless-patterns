import { routeLocale } from "@/lib/i18n";
import { KnitColorworkView, knitColorworkMetadata } from "@/views/KnitColorworkViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return knitColorworkMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <KnitColorworkView locale={routeLocale((await params).locale)} />;
}
