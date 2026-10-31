import { routeLocale } from "@/lib/i18n";
import { MazeView, mazeMetadata } from "@/views/MazeView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return mazeMetadata(routeLocale((await params).locale));
}

export default async function Page({ params }: Props) {
  return <MazeView locale={routeLocale((await params).locale)} />;
}
