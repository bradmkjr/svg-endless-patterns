import { routeLocale } from "@/lib/i18n";
import { StitchesView, stitchesMetadata } from "@/views/StitchViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return stitchesMetadata(routeLocale((await params).locale), "crochet");
}

export default async function Page({ params }: Props) {
  return <StitchesView locale={routeLocale((await params).locale)} craft="crochet" />;
}
