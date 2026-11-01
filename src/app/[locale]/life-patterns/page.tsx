import { routeLocale } from "@/lib/i18n";
import { LifeView, lifeMetadata } from "@/views/LifeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return lifeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <LifeView locale={routeLocale((await params).locale)} />;
}
