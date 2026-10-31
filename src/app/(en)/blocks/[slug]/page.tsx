import { BlockView, blockMetadata, blockSlugs } from "@/views/BlockViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blockSlugs();
}

export async function generateMetadata({ params }: Props) {
  return blockMetadata("en", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <BlockView locale="en" slug={(await params).slug} />;
}
