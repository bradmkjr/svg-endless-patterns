import { StitchView, stitchMetadata, stitchSlugs } from "@/views/StitchViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return stitchSlugs("crochet");
}

export async function generateMetadata({ params }: Props) {
  return stitchMetadata("en", "crochet", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <StitchView locale="en" craft="crochet" slug={(await params).slug} />;
}
