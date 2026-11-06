import { routeLocale } from "@/lib/i18n";
import { KaleidoscopeView, kaleidoscopeMetadata } from "@/views/KaleidoscopeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return kaleidoscopeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <KaleidoscopeView locale={routeLocale((await params).locale)} />;
}
