import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { MazeView, mazeMetadata } from "@/views/MazeView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("maze");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("maze", "en", (await params).option, mazeMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <MazeView locale="en" option={(await params).option} />;
}
