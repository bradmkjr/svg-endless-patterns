import { routeLocale } from "@/lib/i18n";
import { CrochetColorworkView, crochetColorworkMetadata } from "@/views/CrochetColorworkViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return crochetColorworkMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <CrochetColorworkView locale={routeLocale((await params).locale)} />;
}
