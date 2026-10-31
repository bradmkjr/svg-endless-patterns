import { routeLocale } from "@/lib/i18n";
import { AboutView, aboutMetadata } from "@/views/AboutView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return aboutMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <AboutView locale={routeLocale((await params).locale)} />;
}
