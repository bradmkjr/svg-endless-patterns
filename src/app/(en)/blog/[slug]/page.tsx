import { PostView, postMetadata, postSlugs } from "@/views/BlogViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return postSlugs();
}

export async function generateMetadata({ params }: Props) {
  return postMetadata("en", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <PostView locale="en" slug={(await params).slug} />;
}
