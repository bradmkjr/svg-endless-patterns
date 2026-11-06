import { optionMetadata } from "@/lib/toolPages";
import { toolSlugs } from "@/lib/toolOptions";
import { WeavingView, weavingMetadata } from "@/views/WeavingView";

type Props = { params: Promise<{ option: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs("weaving");
}

export async function generateMetadata({ params }: Props) {
  return optionMetadata("weaving", "en", (await params).option, weavingMetadata("en"));
}

export default async function Page({ params }: Props) {
  return <WeavingView locale="en" option={(await params).option} />;
}
