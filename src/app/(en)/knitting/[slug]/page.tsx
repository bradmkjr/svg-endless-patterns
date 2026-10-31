import { StitchView, stitchMetadata, stitchSlugs } from "@/views/StitchViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return stitchSlugs("knit");
}

export async function generateMetadata({ params }: Props) {
  return stitchMetadata("en", "knit", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <StitchView locale="en" craft="knit" slug={(await params).slug} />;
}
