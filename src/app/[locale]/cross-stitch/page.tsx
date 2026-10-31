import { routeLocale } from "@/lib/i18n";
import { CrossStitchView, crossStitchMetadata } from "@/views/CrossStitchView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return crossStitchMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <CrossStitchView locale={routeLocale((await params).locale)} />;
}
