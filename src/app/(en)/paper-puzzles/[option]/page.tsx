import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { PuzzleView, puzzleMetadata } from "@/views/PuzzleViews";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("puzzle");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("puzzle", "en", (await params).option, puzzleMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <PuzzleView locale="en" option={(await params).option} />;
}
