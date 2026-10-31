import { routeLocale } from "@/lib/i18n";
import { HomeView, homeMetadata } from "@/views/HomeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return homeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <HomeView locale={routeLocale((await params).locale)} />;
}
