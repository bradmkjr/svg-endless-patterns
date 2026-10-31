import { routeLocale } from "@/lib/i18n";
import { CheckerboardView, checkerboardMetadata } from "@/views/CheckerboardView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return checkerboardMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <CheckerboardView locale={routeLocale((await params).locale)} />;
}
