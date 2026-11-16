import { routeLocale } from "@/lib/i18n";
import { LetteringView, letteringMetadata } from "@/views/LetteringView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return letteringMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <LetteringView locale={routeLocale((await params).locale)} />;
}
