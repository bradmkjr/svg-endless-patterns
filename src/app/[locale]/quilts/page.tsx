import { routeLocale } from "@/lib/i18n";
import { QuiltView, quiltMetadata } from "@/views/QuiltView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return quiltMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <QuiltView locale={routeLocale((await params).locale)} />;
}
