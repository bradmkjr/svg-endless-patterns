import { routeLocale } from "@/lib/i18n";
import { FractalView, fractalMetadata } from "@/views/FractalView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return fractalMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <FractalView locale={routeLocale((await params).locale)} />;
}
