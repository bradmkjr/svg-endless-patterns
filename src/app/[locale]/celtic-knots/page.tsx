import { routeLocale } from "@/lib/i18n";
import { CelticKnotView, celticKnotMetadata } from "@/views/CelticKnotView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return celticKnotMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <CelticKnotView locale={routeLocale((await params).locale)} />;
}
