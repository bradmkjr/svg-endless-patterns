import { routeLocale } from "@/lib/i18n";
import { PrivacyView, privacyMetadata } from "@/views/LegalViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return privacyMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <PrivacyView locale={routeLocale((await params).locale)} />;
}
