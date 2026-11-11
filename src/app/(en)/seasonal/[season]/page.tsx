import { SeasonView, seasonMetadata, seasonIds } from "@/views/SeasonalViews";

type Props = { params: Promise<{ season: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return seasonIds();
}

export async function generateMetadata({ params }: Props) {
  return seasonMetadata("en", (await params).season);
}

export default async function Page({ params }: Props) {
  return <SeasonView locale="en" id={(await params).season} />;
}
