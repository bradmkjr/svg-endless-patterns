import { routeLocale } from "@/lib/i18n";
import { BlocksView, blocksMetadata } from "@/views/BlockViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return blocksMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <BlocksView locale={routeLocale((await params).locale)} />;
}
