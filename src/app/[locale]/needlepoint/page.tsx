import { routeLocale } from "@/lib/i18n";
import { NeedlepointView, needlepointMetadata } from "@/views/NeedlepointView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return needlepointMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <NeedlepointView locale={routeLocale((await params).locale)} />;
}
