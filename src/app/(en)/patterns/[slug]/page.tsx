import { PatternView, patternMetadata, patternSlugs } from "@/views/PatternViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return patternSlugs();
}

export async function generateMetadata({ params }: Props) {
  return patternMetadata("en", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <PatternView locale="en" slug={(await params).slug} />;
}
