import { routeLocale } from "@/lib/i18n";
import { BraidView, braidMetadata } from "@/views/BraidView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return braidMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <BraidView locale={routeLocale((await params).locale)} />;
}
