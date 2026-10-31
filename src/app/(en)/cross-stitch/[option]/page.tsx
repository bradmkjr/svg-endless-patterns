import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { CrossStitchView, crossStitchMetadata } from "@/views/CrossStitchView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("crossStitch");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("crossStitch", "en", (await params).option, crossStitchMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <CrossStitchView locale="en" option={(await params).option} />;
}
