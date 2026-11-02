import { routeLocale } from "@/lib/i18n";
import { PuzzleHubView, puzzleMetadata } from "@/views/PuzzleViews";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return puzzleMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <PuzzleHubView locale={routeLocale((await params).locale)} />;
}
