import { routeLocale } from "@/lib/i18n";
import { AcknowledgementsView, acknowledgementsMetadata } from "@/views/AcknowledgementsView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return acknowledgementsMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <AcknowledgementsView locale={routeLocale((await params).locale)} />;
}
