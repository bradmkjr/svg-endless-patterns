import { routeLocale } from "@/lib/i18n";
import { TruchetView, truchetMetadata } from "@/views/TruchetView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return truchetMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <TruchetView locale={routeLocale((await params).locale)} />;
}
