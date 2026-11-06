import { routeLocale } from "@/lib/i18n";
import { ReactionDiffusionView, reactionDiffusionMetadata } from "@/views/ReactionDiffusionView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return reactionDiffusionMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <ReactionDiffusionView locale={routeLocale((await params).locale)} />;
}
