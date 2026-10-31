import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { StainedGlassView, stainedGlassMetadata } from "@/views/StainedGlassView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("stainedGlass");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("stainedGlass", "en", (await params).option, stainedGlassMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <StainedGlassView locale="en" option={(await params).option} />;
}
