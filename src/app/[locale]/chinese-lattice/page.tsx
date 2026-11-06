import { routeLocale } from "@/lib/i18n";
import { ChineseLatticeView, chineseLatticeMetadata } from "@/views/ChineseLatticeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return chineseLatticeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <ChineseLatticeView locale={routeLocale((await params).locale)} />;
}
