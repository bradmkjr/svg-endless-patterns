import { routeLocale } from "@/lib/i18n";
import { TermsView, termsMetadata } from "@/views/LegalViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return termsMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <TermsView locale={routeLocale((await params).locale)} />;
}
