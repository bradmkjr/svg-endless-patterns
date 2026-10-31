import { routeLocale } from "@/lib/i18n";
import { GirihView, girihMetadata } from "@/views/GirihView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return girihMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <GirihView locale={routeLocale((await params).locale)} />;
}
